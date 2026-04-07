/**
 * useWebRTC Hook - Main hook for WebRTC connection management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MediaStream } from 'react-native-webrtc';
import { PeerConnection } from '../services/peerConnection';
import { ICEServer, CallState, SignalingMessage, RTCSessionDescriptionInit, RTCIceCandidateInit } from '../types';
import { DEFAULT_ICE_SERVERS } from '../utils/iceServers';

export interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  iceServers?: ICEServer[];
  onCallStateChange?: (state: CallState) => void;
  onError?: (error: Error) => void;
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callState: CallState;
  remoteUserId: string | null;
  startLocalMedia: () => Promise<MediaStream>;
  handleSignalingMessage: (message: SignalingMessage) => Promise<void>;
  setSignalingCallbacks: (callbacks: SignalingCallbacks) => void;
  endCall: () => void;
}

interface SignalingCallbacks {
  sendOffer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
  sendAnswer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidateInit) => void;
}

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const {
    iceServers = DEFAULT_ICE_SERVERS,
    onCallStateChange,
    onError,
  } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  const pcRef = useRef<PeerConnection | null>(null);
  const signalingRef = useRef<SignalingCallbacks | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  // Update call state helper
  const updateCallState = useCallback(
    (newState: CallState) => {
      setCallState(newState);
      onCallStateChange?.(newState);
    },
    [onCallStateChange]
  );

  // Initialize peer connection
  const initPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new PeerConnection({ iceServers });

    // Handle ICE candidates - use ref to get current remoteUserId
    pc.onIceCandidate((candidate) => {
      const currentRemoteUserId = remoteUserIdRef.current;
      if (currentRemoteUserId && signalingRef.current) {
        signalingRef.current.sendIceCandidate(currentRemoteUserId, candidate);
      }
    });

    // Handle incoming tracks
    pc.onTrack((track, stream) => {
      console.log('[useWebRTC] Remote track received:', track.kind);
      setRemoteStream(stream);
      updateCallState('connected');
    });

    // Handle connection state changes
    pc.onConnectionStateChange((connectionState) => {
      console.log('[useWebRTC] Connection state:', connectionState);

      if (connectionState === 'connected') {
        updateCallState('connected');
      } else if (connectionState === 'disconnected') {
        updateCallState('reconnecting');
      } else if (connectionState === 'failed') {
        updateCallState('failed');
        onError?.(new Error('WebRTC connection failed'));
      }
    });

    // Handle ICE state changes
    pc.onIceConnectionStateChange((iceState) => {
      console.log('[useWebRTC] ICE state:', iceState);

      if (iceState === 'failed') {
        updateCallState('failed');
        onError?.(new Error('ICE connection failed'));
      }
    });

    pcRef.current = pc;
    return pc;
  }, [iceServers, updateCallState, onError]);

  // Start local media
  const startLocalMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const pc = pcRef.current || initPeerConnection();
      const stream = await pc.getLocalStream();
      pc.addLocalStream(stream);

      setLocalStream(stream);
      console.log('[useWebRTC] Local media started');
      return stream;
    } catch (error) {
      console.error('[useWebRTC] Failed to start local media:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [initPeerConnection, onError]);

  // Set signaling callbacks
  const setSignalingCallbacks = useCallback((callbacks: SignalingCallbacks) => {
    signalingRef.current = callbacks;
  }, []);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      switch (message.type) {
        case 'room-users':
          // Initiate call to existing users
          if (message.users.length > 0) {
            const targetUserId = message.users[0];
            remoteUserIdRef.current = targetUserId;
            setRemoteUserId(targetUserId);
            updateCallState('connecting');

            if (pcRef.current) {
              try {
                const offer = await pcRef.current.createOffer();
                signalingRef.current?.sendOffer(targetUserId, offer);
              } catch (error) {
                console.error('[useWebRTC] Failed to create offer:', error);
              }
            }
          }
          break;

        case 'user-joined':
          console.log('[useWebRTC] User joined:', message.userId);
          remoteUserIdRef.current = message.userId;
          setRemoteUserId(message.userId);
          break;

        case 'offer':
          // Received offer - create answer
          if (pcRef.current && message.sdp) {
            remoteUserIdRef.current = message.fromUserId;
            setRemoteUserId(message.fromUserId);
            updateCallState('connecting');

            try {
              await pcRef.current.setRemoteDescription(message.sdp);
              const answer = await pcRef.current.createAnswer();
              signalingRef.current?.sendAnswer(message.fromUserId, answer);
            } catch (error) {
              console.error('[useWebRTC] Failed to handle offer:', error);
              onError?.(error as Error);
            }
          }
          break;

        case 'answer':
          // Received answer
          if (pcRef.current && message.sdp) {
            try {
              await pcRef.current.setRemoteDescription(message.sdp);
            } catch (error) {
              console.error('[useWebRTC] Failed to handle answer:', error);
            }
          }
          break;

        case 'ice-candidate':
          // Received ICE candidate
          if (pcRef.current && message.candidate) {
            try {
              await pcRef.current.addIceCandidate(message.candidate);
            } catch (error) {
              console.error('[useWebRTC] Failed to add ICE candidate:', error);
            }
          }
          break;

        case 'user-left':
          setRemoteStream(null);
          remoteUserIdRef.current = null;
          setRemoteUserId(null);
          updateCallState('remote-ended');
          break;

        case 'error':
          onError?.(new Error(message.message));
          break;
      }
    },
    [updateCallState, onError]
  );

  // End call
  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    pcRef.current?.close();
    pcRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setCallState('ended');
    remoteUserIdRef.current = null;
    setRemoteUserId(null);

    onCallStateChange?.('ended');
  }, [localStream, onCallStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      pcRef.current?.close();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    callState,
    remoteUserId,
    startLocalMedia,
    handleSignalingMessage,
    setSignalingCallbacks,
    endCall,
  };
}
