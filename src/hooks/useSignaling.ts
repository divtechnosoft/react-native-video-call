/**
 * useSignaling Hook - React hook for Socket.io signaling connection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signalingClient';
import { SignalingMessage, RTCSessionDescriptionInit, RTCIceCandidateInit } from '../types';

export interface UseSignalingOptions {
  url: string;
  roomId: string;
  userId: string;
  onMessage?: (message: SignalingMessage) => void;
}

export interface UseSignalingReturn {
  isConnected: boolean;
  joinRoom: () => void;
  leaveRoom: () => void;
  sendOffer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
  sendAnswer: (targetUserId: string, sdp: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidateInit) => void;
}

export function useSignaling(options: UseSignalingOptions): UseSignalingReturn {
  const { url, roomId, userId, onMessage } = options;

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<SignalingClient | null>(null);

  // Initialize signaling client
  useEffect(() => {
    const client = new SignalingClient(url);

    client.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    client.onMessage((message) => {
      onMessage?.(message);
    });

    client.connect().catch((error) => {
      console.error('[useSignaling] Connection error:', error);
    });

    clientRef.current = client;

    return () => {
      client.leaveRoom(roomId, userId);
      client.disconnect();
    };
  }, [url, roomId, userId, onMessage]);

  // Join room
  const joinRoom = useCallback(() => {
    clientRef.current?.joinRoom(roomId, userId);
  }, [roomId, userId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    clientRef.current?.leaveRoom(roomId, userId);
  }, [roomId, userId]);

  // Send offer
  const sendOffer = useCallback(
    (targetUserId: string, sdp: RTCSessionDescriptionInit) => {
      clientRef.current?.sendOffer(targetUserId, sdp, userId);
    },
    [userId]
  );

  // Send answer
  const sendAnswer = useCallback(
    (targetUserId: string, sdp: RTCSessionDescriptionInit) => {
      clientRef.current?.sendAnswer(targetUserId, sdp, userId);
    },
    [userId]
  );

  // Send ICE candidate
  const sendIceCandidate = useCallback(
    (targetUserId: string, candidate: RTCIceCandidateInit) => {
      clientRef.current?.sendIceCandidate(targetUserId, candidate, userId);
    },
    [userId]
  );

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
