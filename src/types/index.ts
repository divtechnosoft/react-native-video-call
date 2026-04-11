/**
 * Core type definitions for react-native-video-call
 */

import { MediaStream } from 'react-native-webrtc';
import { RTCIceCandidateInit, RTCSessionDescriptionInit } from './webrtc';

// Re-export types from react-native-webrtc directly
export { MediaStream, MediaStreamTrack, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';

// Export our custom types
export { RTCIceCandidateInit, RTCSessionDescriptionInit, RTCPeerConnectionState, RTCIceConnectionState, iceCandidateToInit } from './webrtc';

// ICE Server configuration
export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// Call states
export type CallState =
  | 'idle'
  | 'requesting-permissions'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'paused'
  | 'resuming'
  | 'failed'
  | 'ended'
  | 'remote-ended';

// Signaling messages
export type SignalingMessage =
  | { type: 'room-users'; users: string[] }
  | { type: 'user-joined'; userId: string }
  | { type: 'user-left'; userId: string }
  | { type: 'offer'; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; fromUserId: string; candidate: RTCIceCandidateInit }
  | { type: 'user-paused'; userId: string }
  | { type: 'user-resumed'; userId: string }
  | { type: 'error'; message: string };

// User info
export interface CallUser {
  userId: string;
  stream?: MediaStream;
  joinedAt?: number;
}

// Permission state
export interface PermissionState {
  hasCamera: boolean;
  hasMicrophone: boolean;
  isRequesting: boolean;
  error: string | null;
}
