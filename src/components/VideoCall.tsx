/**
 * VideoCall Component - Main component users import
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, AppState, AppStateStatus } from 'react-native';
import { MediaStream } from 'react-native-webrtc';
import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';
import { Controls } from './Controls';
import { PauseOverlay } from './PauseOverlay';
import { SignalingClient } from '../services/signalingClient';
import { PeerConnection } from '../services/peerConnection';
import { AudioManager } from '../services/audioManager';
import { CallState, SignalingMessage, ICEServer, CallUser } from '../types';
import { DEFAULT_ICE_SERVERS } from '../utils/iceServers';

const DEFAULT_SIGNALING_URL = 'http://localhost:8080';

export interface VideoCallProps {
  roomId: string;
  userId: string;
  signalingUrl?: string;
  iceServers?: ICEServer[];
  enableAudio?: boolean;
  enableVideo?: boolean;
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
  enableAudio = true,
  enableVideo = true,
  onCallStateChange,
  onUserJoined,
  onUserLeft,
  onError,
  style,
}: VideoCallProps) {
  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [_remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [_remotePaused, setRemotePaused] = useState(false);

  // Refs - use refs for cleanup to avoid stale closures
  const pcRef = useRef<PeerConnection | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isEndingCallRef = useRef(false);

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

    const pc = new PeerConnection({
      iceServers,
      enableAudio,
      enableVideo,
    });

    // Handle ICE candidates - use ref to get current remoteUserId
    pc.onIceCandidate((candidate) => {
      const currentRemoteUserId = remoteUserIdRef.current;
      if (currentRemoteUserId && signalingRef.current) {
        signalingRef.current.sendIceCandidate(currentRemoteUserId, candidate, userId);
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
      console.log('[VideoCall] Connection state:', state);
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
  }, [iceServers, userId, updateCallState, onError, enableAudio, enableVideo]);

  // Handle signaling messages
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
                signalingRef.current?.sendOffer(targetUserId, offer, userId);
              } catch (error) {
                console.error('[VideoCall] Failed to create offer:', error);
              }
            }
          }
          break;

        case 'user-joined':
          remoteUserIdRef.current = message.userId;
          setRemoteUserId(message.userId);
          onUserJoined?.({ userId: message.userId });
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

        case 'user-paused':
          console.log('[VideoCall] Remote user paused:', message.userId);
          setRemotePaused(true);
          break;

        case 'user-resumed':
          console.log('[VideoCall] Remote user resumed:', message.userId);
          setRemotePaused(false);
          break;

        case 'user-left':
          setRemoteStream(null);
          remoteUserIdRef.current = null;
          setRemoteUserId(null);
          setRemotePaused(false);
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
      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log('[VideoCall] Local media started');
    } catch (error) {
      console.error('[VideoCall] Failed to start media:', error);
      throw error;
    }
  }, [initPeerConnection]);

  // Pause call (mute audio and video, notify remote)
  const pauseCall = useCallback(() => {
    console.log('[VideoCall] Pausing call');
    setIsPaused(true);
    updateCallState('paused');

    // Mute local audio and video
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    }

    // Notify remote user
    if (signalingRef.current && remoteUserIdRef.current) {
      signalingRef.current.sendPause?.(remoteUserIdRef.current, userId);
    }
  }, [userId, updateCallState]);

  // Resume call (unmute audio and video, notify remote)
  const resumeCall = useCallback(async () => {
    console.log('[VideoCall] Resuming call');
    setIsResuming(true);
    updateCallState('resuming');

    try {
      // Unmute local audio and video
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
      }

      // Restore speaker
      await AudioManager.enableSpeaker();

      // Notify remote user
      if (signalingRef.current && remoteUserIdRef.current) {
        signalingRef.current.sendResume?.(remoteUserIdRef.current, userId);
      }

      setIsPaused(false);
      setIsResuming(false);
      updateCallState('connected');
    } catch (error) {
      console.error('[VideoCall] Failed to resume call:', error);
      setIsResuming(false);
    }
  }, [userId, updateCallState]);

  // End call properly - ensure signaling is sent before cleanup
  const handleEndCall = useCallback(async () => {
    // Prevent multiple calls
    if (isEndingCallRef.current) return;
    isEndingCallRef.current = true;

    console.log('[VideoCall] Ending call');

    // First, send leave message and wait for it to be sent
    if (signalingRef.current) {
      signalingRef.current.leaveRoom(roomId, userId);
      // Give a small delay to ensure message is sent
      await new Promise((resolve) => setTimeout(resolve, 100));
      signalingRef.current.disconnect();
    }

    // Clean up audio
    AudioManager.cleanup();

    // Close peer connection
    pcRef.current?.close();
    pcRef.current = null;

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;

    // Update state
    setLocalStream(null);
    setRemoteStream(null);
    setIsPaused(false);
    setIsResuming(false);
    setRemotePaused(false);
    updateCallState('ended');
  }, [roomId, userId, updateCallState]);

  // Handle app state changes (for phone call detection)
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      console.log('[VideoCall] App state:', appStateRef.current, '->', nextAppState);

      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // If call is already ended, don't do anything
      if (callState === 'ended' || callState === 'remote-ended') return;

      // App went to background (possible phone call)
      if (previousState === 'active' && nextAppState === 'inactive') {
        // On iOS, inactive -> background often means phone call
        console.log('[VideoCall] App became inactive - possible phone interruption');
      }

      if (previousState === 'active' && nextAppState === 'background') {
        // App went to background - pause the call
        if (callState === 'connected' && !isPaused) {
          console.log('[VideoCall] App backgrounded - pausing call');
          pauseCall();
        }
      }

      // App came back to foreground
      if (
        (previousState === 'background' || previousState === 'inactive') &&
        nextAppState === 'active'
      ) {
        console.log('[VideoCall] App foregrounded');
        // Don't auto-resume - let user choose via the UI
      }
    },
    [callState, isPaused, pauseCall]
  );

  // Initialize
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Initialize audio manager for video call (speaker mode)
      await AudioManager.initialize('video-call');

      // Initialize peer connection
      initPeerConnection();

      // Initialize signaling
      const client = new SignalingClient(signalingUrl);
      client.onMessage(handleSignalingMessage);

      try {
        await client.connect();
        if (!isMounted) return;

        signalingRef.current = client;

        // Start local media
        await startLocalMedia();
        if (!isMounted) return;

        // Join room
        client.joinRoom(roomId, userId);
      } catch (error) {
        console.error('[VideoCall] Initialization error:', error);
        if (isMounted) {
          onError?.(error as Error);
        }
      }
    };

    init();

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      subscription.remove();
      console.log('[VideoCall] Cleanup');

      // Clean up audio manager
      AudioManager.cleanup();

      // Send leave message before disconnect
      if (signalingRef.current && !isEndingCallRef.current) {
        signalingRef.current.leaveRoom(roomId, userId);
        signalingRef.current.disconnect();
      }

      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      pcRef.current?.close();
    };
  }, []); // Empty deps - we only want to initialize once

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream && !isPaused) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream, isPaused]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream && !isPaused) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [localStream, isPaused]);

  // Toggle speaker
  const toggleSpeaker = useCallback(async () => {
    if (!isPaused) {
      const enabled = await AudioManager.toggleSpeaker();
      setIsSpeakerEnabled(enabled);
    }
  }, [isPaused]);

  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" />

      {/* Main video - remote participant */}
      <View style={styles.remoteVideo}>
        <RemoteVideo stream={remoteStream} callState={callState} />
      </View>

      {/* PiP - local video */}
      {!isPaused ? (
        <View style={styles.localVideo}>
          <LocalVideo
            stream={localStream}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
          />
        </View>
      ) : null}

      {/* Pause overlay with resume/end buttons */}
      <PauseOverlay
        isPaused={isPaused}
        isResuming={isResuming}
        onResume={resumeCall}
        onEnd={handleEndCall}
      />

      {/* Controls - hide when paused */}
      {!isPaused && !isResuming ? (
        <View style={styles.controls}>
          <Controls
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isSpeakerEnabled={isSpeakerEnabled}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={handleEndCall}
          />
        </View>
      ) : null}
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
