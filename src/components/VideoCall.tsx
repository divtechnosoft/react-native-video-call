/**
 * VideoCall Component - Main component users import
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { MediaStream } from 'react-native-webrtc';
import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';
import { Controls } from './Controls';
import { usePermissions } from '../hooks/usePermissions';
import { SignalingClient } from '../services/signalingClient';
import { PeerConnection } from '../services/peerConnection';
import { CallState, SignalingMessage, ICEServer, CallUser } from '../types';
import { DEFAULT_ICE_SERVERS } from '../utils/iceServers';

const DEFAULT_SIGNALING_URL = 'http://localhost:8080';

export interface VideoCallProps {
  roomId: string;
  userId: string;
  signalingUrl?: string;
  iceServers?: ICEServer[];
  onCallStateChange?: (state: CallState) => void;
  onUserJoined?: (user: CallUser) => void;
  onUserLeft?: (userId: string) => void;
  onError?: (error: Error) => void;
  style?: object;
}

export function VideoCall({
  roomId,
  userId,
  signalingUrl = DEFAULT_SIGNALING_URL,
  iceServers = DEFAULT_ICE_SERVERS,
  onCallStateChange,
  onUserJoined,
  onUserLeft,
  onError,
  style,
}: VideoCallProps) {
  // Permissions
  const { requestPermissions } = usePermissions();

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Refs
  const pcRef = useRef<PeerConnection | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);

  // Update call state
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

    const pc = new PeerConnection(iceServers);

    // Handle ICE candidates
    pc.onIceCandidate((candidate) => {
      if (remoteUserId && signalingRef.current) {
        signalingRef.current.sendIceCandidate(remoteUserId, candidate, userId);
      }
    });

    // Handle incoming tracks
    pc.onTrack((track, stream) => {
      console.log('[VideoCall] Remote track received:', track.kind);
      setRemoteStream(stream);
      updateCallState('connected');
    });

    // Handle connection state changes
    pc.onConnectionStateChange((state) => {
      if (state === 'connected') {
        updateCallState('connected');
      } else if (state === 'disconnected') {
        updateCallState('reconnecting');
      } else if (state === 'failed') {
        updateCallState('failed');
        onError?.(new Error('Connection failed'));
      }
    });

    pcRef.current = pc;
    return pc;
  }, [iceServers, remoteUserId, userId, updateCallState, onError]);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      switch (message.type) {
        case 'room-users':
          // Initiate call to existing users
          if (message.users.length > 0) {
            const targetUserId = message.users[0];
            setRemoteUserId(targetUserId);
            updateCallState('connecting');

            if (pcRef.current) {
              try {
                const offer = await pcRef.current.createOffer();
                signalingRef.current?.sendOffer(targetUserId, offer, userId);
              } catch (error) {
                console.error('[VideoCall] Failed to create offer:', error);
              }
            }
          }
          break;

        case 'user-joined':
          setRemoteUserId(message.userId);
          onUserJoined?.({ userId: message.userId });
          break;

        case 'offer':
          // Received offer - create answer
          if (pcRef.current && message.sdp) {
            setRemoteUserId(message.fromUserId);
            updateCallState('connecting');

            try {
              await pcRef.current.setRemoteDescription(message.sdp);
              const answer = await pcRef.current.createAnswer();
              signalingRef.current?.sendAnswer(message.fromUserId, answer, userId);
            } catch (error) {
              console.error('[VideoCall] Failed to handle offer:', error);
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
              console.error('[VideoCall] Failed to handle answer:', error);
            }
          }
          break;

        case 'ice-candidate':
          // Received ICE candidate
          if (pcRef.current && message.candidate) {
            try {
              await pcRef.current.addIceCandidate(message.candidate);
            } catch (error) {
              console.error('[VideoCall] Failed to add ICE candidate:', error);
            }
          }
          break;

        case 'user-left':
          setRemoteStream(null);
          setRemoteUserId(null);
          updateCallState('remote-ended');
          onUserLeft?.(message.userId);
          break;

        case 'error':
          onError?.(new Error(message.message));
          break;
      }
    },
    [userId, updateCallState, onUserJoined, onUserLeft, onError]
  );

  // Start local media
  const startLocalMedia = useCallback(async () => {
    try {
      const pc = pcRef.current || initPeerConnection();
      const stream = await pc.getLocalStream();
      pc.addLocalStream(stream);
      setLocalStream(stream);
      console.log('[VideoCall] Local media started');
    } catch (error) {
      console.error('[VideoCall] Failed to start media:', error);
      throw error;
    }
  }, [initPeerConnection]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      // Initialize peer connection
      initPeerConnection();

      // Initialize signaling
      const client = new SignalingClient(signalingUrl);
      client.onMessage(handleSignalingMessage);

      try {
        await client.connect();
        signalingRef.current = client;

        // Request permissions
        updateCallState('requesting-permissions');
        const granted = await requestPermissions();

        if (granted) {
          await startLocalMedia();

          // Join room
          client.joinRoom(roomId, userId);
        } else {
          onError?.(new Error('Camera and microphone permissions are required'));
        }
      } catch (error) {
        console.error('[VideoCall] Initialization error:', error);
        onError?.(error as Error);
      }
    };

    init();

    return () => {
      // Cleanup
      signalingRef.current?.leaveRoom(roomId, userId);
      signalingRef.current?.disconnect();
      pcRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // End call
  const handleEndCall = useCallback(() => {
    signalingRef.current?.leaveRoom(roomId, userId);
    pcRef.current?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    updateCallState('ended');
  }, [roomId, userId, localStream, updateCallState]);

  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" />

      {/* Main video - remote participant */}
      <View style={styles.remoteVideo}>
        <RemoteVideo stream={remoteStream} callState={callState} />
      </View>

      {/* PiP - local video */}
      <View style={styles.localVideo}>
        <LocalVideo
          stream={localStream}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Controls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={handleEndCall}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
