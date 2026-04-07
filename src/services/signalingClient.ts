/**
 * SignalingClient - Socket.io client for WebRTC signaling
 */

import io, { Socket } from 'socket.io-client';
import { SignalingMessage, RTCSessionDescriptionInit, RTCIceCandidateInit } from '../types';

// Event handler types
export type MessageHandler = (message: SignalingMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;

export class SignalingClient {
  private socket: Socket | null = null;
  private url: string;
  private messageHandler: MessageHandler | null = null;
  private connectionHandler: ConnectionHandler | null = null;

  constructor(url: string) {
    this.url = url;
    console.log('[SignalingClient] Created with URL:', url);
  }

  // Connect to signaling server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[SignalingClient] Connecting to:', this.url);

        this.socket = io(this.url, {
          transports: ['websocket', 'polling'], // Add polling as fallback for iOS
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 20000, // Increased timeout
          forceNew: true,
        });

        this.socket.on('connect', () => {
          console.log('[SignalingClient] Connected to server');
          this.connectionHandler?.(true);
          resolve();
        });

        this.socket.on('connecting', (transport) => {
          console.log('[SignalingClient] Connecting via:', transport);
        });

        // Room users list
        this.socket.on('room-users', (data: { users: string[] }) => {
          console.log('[SignalingClient] Received room-users:', data.users);
          this.messageHandler?.({ type: 'room-users', users: data.users });
        });

        // User joined
        this.socket.on('user-joined', (data: { userId: string }) => {
          console.log('[SignalingClient] User joined:', data.userId);
          this.messageHandler?.({ type: 'user-joined', userId: data.userId });
        });

        // User left
        this.socket.on('user-left', (data: { userId: string }) => {
          console.log('[SignalingClient] User left:', data.userId);
          this.messageHandler?.({ type: 'user-left', userId: data.userId });
        });

        // Offer received
        this.socket.on('offer', (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
          console.log('[SignalingClient] Offer received from:', data.fromUserId);
          this.messageHandler?.({
            type: 'offer',
            fromUserId: data.fromUserId,
            sdp: data.sdp,
          });
        });

        // Answer received
        this.socket.on('answer', (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
          console.log('[SignalingClient] Answer received from:', data.fromUserId);
          this.messageHandler?.({
            type: 'answer',
            fromUserId: data.fromUserId,
            sdp: data.sdp,
          });
        });

        // ICE candidate received
        this.socket.on('ice-candidate', (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
          console.log('[SignalingClient] ICE candidate received from:', data.fromUserId);
          this.messageHandler?.({
            type: 'ice-candidate',
            fromUserId: data.fromUserId,
            candidate: data.candidate,
          });
        });

        // Error
        this.socket.on('error', (data: { message: string }) => {
          console.error('[SignalingClient] Server error:', data.message);
          this.messageHandler?.({ type: 'error', message: data.message });
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[SignalingClient] Disconnected:', reason);
          this.connectionHandler?.(false);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SignalingClient] Connection error:', error.message || error);
          reject(error);
        });

        this.socket.on('reconnect_attempt', (attempt) => {
          console.log('[SignalingClient] Reconnection attempt:', attempt);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('[SignalingClient] Reconnection failed');
          reject(new Error('Reconnection failed'));
        });

      } catch (error) {
        console.error('[SignalingClient] Failed to create socket:', error);
        reject(error);
      }
    });
  }

  // Register message handler
  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  // Register connection handler
  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandler = handler;
  }

  // Join a room
  joinRoom(roomId: string, userId: string) {
    console.log('[SignalingClient] Joining room:', roomId, 'as', userId);
    this.socket?.emit('join', { roomId, userId });
  }

  // Leave a room
  leaveRoom(roomId: string, userId: string) {
    console.log('[SignalingClient] Leaving room:', roomId);
    this.socket?.emit('leave', { roomId, userId });
  }

  // Send SDP offer
  sendOffer(targetUserId: string, sdp: RTCSessionDescriptionInit, fromUserId?: string) {
    console.log('[SignalingClient] Sending offer to:', targetUserId);
    this.socket?.emit('offer', {
      targetUserId,
      fromUserId,
      sdp,
    });
  }

  // Send SDP answer
  sendAnswer(targetUserId: string, sdp: RTCSessionDescriptionInit, fromUserId?: string) {
    console.log('[SignalingClient] Sending answer to:', targetUserId);
    this.socket?.emit('answer', {
      targetUserId,
      fromUserId,
      sdp,
    });
  }

  // Send ICE candidate
  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit, fromUserId?: string) {
    console.log('[SignalingClient] Sending ICE candidate to:', targetUserId);
    this.socket?.emit('ice-candidate', {
      targetUserId,
      fromUserId,
      candidate,
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      console.log('[SignalingClient] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
