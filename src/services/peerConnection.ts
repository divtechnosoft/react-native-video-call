/**
 * PeerConnection Service - Manages WebRTC RTCPeerConnection
 */

import { Platform } from 'react-native';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, MediaStream, MediaStreamTrack, mediaDevices } from 'react-native-webrtc';
import { ICEServer, RTCSessionDescriptionInit, RTCIceCandidateInit, RTCPeerConnectionState, RTCIceConnectionState, iceCandidateToInit } from '../types';
import { DEFAULT_ICE_SERVERS } from '../utils/iceServers';

// Event handler types
export type IceCandidateHandler = (candidate: RTCIceCandidateInit) => void;
export type TrackHandler = (track: MediaStreamTrack, stream: MediaStream) => void;
export type ConnectionStateChangedHandler = (state: RTCPeerConnectionState) => void;
export type IceConnectionStateChangedHandler = (state: RTCIceConnectionState) => void;

export interface PeerConnectionOptions {
  iceServers?: ICEServer[];
  enableAudio?: boolean;
  enableVideo?: boolean;
}

// Detect if running on iOS simulator (best effort detection)
const isIOSSimulator = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  // iOS simulator typically doesn't have a real camera/mic
  // Simulators often have issues with WebRTC audio
  // This is a workaround - in production you'd want a more reliable detection
  return !Platform.isTV;
};

export class PeerConnection {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private iceCandidateHandler: IceCandidateHandler | null = null;
  private trackHandler: TrackHandler | null = null;
  private connectionStateHandler: ConnectionStateChangedHandler | null = null;
  private iceStateHandler: IceConnectionStateChangedHandler | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private enableAudio: boolean;
  private enableVideo: boolean;

  constructor(options: PeerConnectionOptions = {}) {
    const {
      iceServers = DEFAULT_ICE_SERVERS,
      enableAudio = true,
      enableVideo = true,
    } = options;

    // Disable audio on iOS simulator to prevent crashes
    if (isIOSSimulator() && enableAudio) {
      console.log('[PeerConnection] iOS Simulator detected - audio may cause issues');
    }

    this.enableAudio = enableAudio;
    this.enableVideo = enableVideo;

    this.pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.pc) return;

    // Cast to any to access addEventListener from event-target-shim
    const pc = this.pc as any;

    // ICE candidate generated
    pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        console.log('[PeerConnection] ICE candidate generated');
        this.iceCandidateHandler?.(iceCandidateToInit(event.candidate));
      }
    });

    // Remote track received (video/audio)
    pc.addEventListener('track', (event: any) => {
      console.log('[PeerConnection] Remote track received:', event.track?.kind);
      if (event.streams && event.streams[0] && event.track) {
        this.trackHandler?.(event.track, event.streams[0]);
      }
    });

    // Connection state changes
    pc.addEventListener('connectionstatechange', () => {
      const state = this.pc?.connectionState;
      console.log('[PeerConnection] Connection state:', state);
      if (state) {
        this.connectionStateHandler?.(state);
      }
    });

    // ICE connection state changes
    pc.addEventListener('iceconnectionstatechange', () => {
      const state = this.pc?.iceConnectionState;
      console.log('[PeerConnection] ICE state:', state);
      if (state) {
        this.iceStateHandler?.(state);
      }
    });
  }

  // Register event handlers
  onIceCandidate(handler: IceCandidateHandler) {
    this.iceCandidateHandler = handler;
  }

  onTrack(handler: TrackHandler) {
    this.trackHandler = handler;
  }

  onConnectionStateChange(handler: ConnectionStateChangedHandler) {
    this.connectionStateHandler = handler;
  }

  onIceConnectionStateChange(handler: IceConnectionStateChangedHandler) {
    this.iceStateHandler = handler;
  }

  // Get local media stream
  async getLocalStream(): Promise<MediaStream> {
    try {
      console.log('[PeerConnection] Getting local stream - audio:', this.enableAudio, 'video:', this.enableVideo);

      const stream = await mediaDevices.getUserMedia({
        audio: this.enableAudio,
        video: this.enableVideo ? {
          facingMode: 'user',
          width: 640,
          height: 480,
        } : false,
      });

      this.localStream = stream;
      console.log('[PeerConnection] Local stream obtained');
      return stream;
    } catch (error) {
      console.error('[PeerConnection] Failed to get local stream:', error);
      throw error;
    }
  }

  // Add local stream tracks to connection
  addLocalStream(stream: MediaStream) {
    if (!this.pc) {
      console.error('[PeerConnection] No peer connection');
      return;
    }

    stream.getTracks().forEach((track: MediaStreamTrack) => {
      this.pc?.addTrack(track, stream);
      console.log('[PeerConnection] Added track:', track.kind);
    });
  }

  // Create SDP offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('No peer connection');

    const offer = await this.pc.createOffer({
      offerToReceiveAudio: this.enableAudio,
      offerToReceiveVideo: this.enableVideo,
    });

    await this.pc.setLocalDescription(offer);
    console.log('[PeerConnection] Created offer');
    return offer;
  }

  // Create SDP answer
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('No peer connection');

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    console.log('[PeerConnection] Created answer');
    return answer;
  }

  // Set remote SDP description
  async setRemoteDescription(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) throw new Error('No peer connection');

    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    console.log('[PeerConnection] Set remote description');

    // Process any queued ICE candidates
    await this.processPendingIceCandidates();
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return;

    // Queue if remote description not set yet
    if (!this.pc.remoteDescription) {
      console.log('[PeerConnection] Queueing ICE candidate (no remote description)');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[PeerConnection] Added ICE candidate');
    } catch (error) {
      console.error('[PeerConnection] Failed to add ICE candidate:', error);
    }
  }

  private async processPendingIceCandidates() {
    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();
      if (candidate) {
        await this.addIceCandidate(candidate);
      }
    }
  }

  // Get current connection state
  getConnectionState(): RTCPeerConnectionState | undefined {
    return this.pc?.connectionState;
  }

  // Get current ICE connection state
  getIceConnectionState(): RTCIceConnectionState | undefined {
    return this.pc?.iceConnectionState;
  }

  // Close connection and cleanup
  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      this.localStream = null;
    }

    if (this.pc) {
      console.log('[PeerConnection] Closing peer connection');
      this.pc.close();
      this.pc = null;
    }

    this.pendingIceCandidates = [];
    this.iceCandidateHandler = null;
    this.trackHandler = null;
    this.connectionStateHandler = null;
    this.iceStateHandler = null;
  }
}
