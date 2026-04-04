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
  }

  // Connect to signaling server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('[SignalingClient] Connected to server');
          this.connectionHandler?.(true);
          resolve();
        });

        // Room users list
        this.socket.on('room-users', (data: { users: string[] }) => {
          this.messageHandler?.({ type: 'room-users', users: data.users });
        });

        // User joined
        this.socket.on('user-joined', (data: { userId: string }) => {
          this.messageHandler?.({ type: 'user-joined', userId: data.userId });
        });

        // User left
        this.socket.on('user-left', (data: { userId: string }) => {
          this.messageHandler?.({ type: 'user-left', userId: data.userId });
        });

        // Offer received
        this.socket.on('offer', (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
          this.messageHandler?.({
            type: 'offer',
            fromUserId: data.fromUserId,
            sdp: data.sdp,
          });
        });

        // Answer received
        this.socket.on('answer', (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
          this.messageHandler?.({
            type: 'answer',
            fromUserId: data.fromUserId,
            sdp: data.sdp,
          });
        });

        // ICE candidate received
        this.socket.on('ice-candidate', (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
          this.messageHandler?.({
            type: 'ice-candidate',
            fromUserId: data.fromUserId,
            candidate: data.candidate,
          });
        });

        // Error
        this.socket.on('error', (data: { message: string }) => {
          this.messageHandler?.({ type: 'error', message: data.message });
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[SignalingClient] Disconnected:', reason);
          this.connectionHandler?.(false);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SignalingClient] Connection error:', error);
          reject(error);
        });

      } catch (error) {
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
    this.socket?.emit('join', { roomId, userId });
    console.log(`[SignalingClient] Joining room: ${roomId} as ${userId}`);
  }

  // Leave a room
  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit('leave', { roomId, userId });
    console.log(`[SignalingClient] Leaving room: ${roomId}`);
  }

  // Send SDP offer
  sendOffer(targetUserId: string, sdp: RTCSessionDescriptionInit, fromUserId?: string) {
    this.socket?.emit('offer', {
      targetUserId,
      fromUserId,
      sdp,
    });
    console.log(`[SignalingClient] Sending offer to ${targetUserId}`);
  }

  // Send SDP answer
  sendAnswer(targetUserId: string, sdp: RTCSessionDescriptionInit, fromUserId?: string) {
    this.socket?.emit('answer', {
      targetUserId,
      fromUserId,
      sdp,
    });
    console.log(`[SignalingClient] Sending answer to ${targetUserId}`);
  }

  // Send ICE candidate
  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit, fromUserId?: string) {
    this.socket?.emit('ice-candidate', {
      targetUserId,
      fromUserId,
      candidate,
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SignalingClient] Disconnected');
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
