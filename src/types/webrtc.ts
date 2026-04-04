/**
 * WebRTC Type Definitions
 * Types not exported by react-native-webrtc are defined here
 */

import { RTCIceCandidate } from 'react-native-webrtc';

// ICE Candidate init type
export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}

// Session description init type
export interface RTCSessionDescriptionInit {
  sdp: string;
  type: string | null;
}

// Connection states
export type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';

// Helper to convert RTCIceCandidate to RTCIceCandidateInit
export function iceCandidateToInit(candidate: RTCIceCandidate): RTCIceCandidateInit {
  return {
    candidate: candidate.candidate,
    sdpMLineIndex: candidate.sdpMLineIndex,
    sdpMid: candidate.sdpMid,
  };
}
