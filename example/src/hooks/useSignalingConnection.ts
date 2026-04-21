/**
 * useSignalingConnection - Reusable hook for connecting to signaling server
 * and listening for custom call events
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSettings } from '../context';

interface UseSignalingConnectionOptions {
  onCallAccepted?: (data: { roomId: string; callerUid: string }) => void;
  onCallRejected?: (data: { roomId: string; callerUid: string }) => void;
  onCallRequest?: (data: {
    roomId: string;
    callerUid: string;
    callerName: string;
    calleeUid: string;
    callType: 'audio' | 'video';
  }) => void;
  onCallCancelled?: (data: { roomId: string; calleeUid: string }) => void;
}

export function useSignalingConnection(options: UseSignalingConnectionOptions = {}) {
  const { settings } = useSettings();
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(settings.signalingUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
    });

    socket.on('connect', () => {
      console.log('[SignalingHook] Connected');
    });

    socket.on('call-request', (data) => {
      console.log('[SignalingHook] call-request received:', data);
      optionsRef.current.onCallRequest?.(data);
    });

    socket.on('call-accepted', (data) => {
      console.log('[SignalingHook] call-accepted received:', data);
      optionsRef.current.onCallAccepted?.(data);
    });

    socket.on('call-rejected', (data) => {
      console.log('[SignalingHook] call-rejected received:', data);
      optionsRef.current.onCallRejected?.(data);
    });

    socket.on('call-cancelled', (data) => {
      console.log('[SignalingHook] call-cancelled received:', data);
      optionsRef.current.onCallCancelled?.(data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SignalingHook] Disconnected:', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [settings.signalingUrl]);

  const joinRoom = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit('join', { roomId, userId });
  }, []);

  const emitCallRequest = useCallback(
    (data: {
      roomId: string;
      callerUid: string;
      callerName: string;
      calleeUid: string;
      callType: 'audio' | 'video';
    }) => {
      socketRef.current?.emit('call-request', data);
    },
    []
  );

  const emitCallAccepted = useCallback((data: { roomId: string; callerUid: string }) => {
    socketRef.current?.emit('call-accepted', data);
  }, []);

  const emitCallRejected = useCallback((data: { roomId: string; callerUid: string }) => {
    socketRef.current?.emit('call-rejected', data);
  }, []);

  const emitCallCancelled = useCallback((data: { roomId: string; calleeUid: string }) => {
    socketRef.current?.emit('call-cancelled', data);
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return {
    joinRoom,
    emitCallRequest,
    emitCallAccepted,
    emitCallRejected,
    emitCallCancelled,
    isConnected,
  };
}
