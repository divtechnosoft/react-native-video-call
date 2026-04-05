/**
 * WaitingScreen - Shown while waiting for another participant to join
 */

import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SignalingClient } from 'react-native-video-call';
import { ThemeText } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';
import { useSettings } from '../../context';

interface WaitingScreenProps {
  roomId: string;
  userId: string;
  onParticipantJoined: () => void;
  onCancel: () => void;
}

export const WaitingScreen = memo(function WaitingScreen({
  roomId,
  userId,
  onParticipantJoined,
  onCancel,
}: WaitingScreenProps) {
  const { settings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const signalingRef = useRef<SignalingClient | null>(null);

  const handleUserJoined = useCallback((joinedUserId: string) => {
    console.log('[WaitingScreen] User joined:', joinedUserId);
    if (joinedUserId !== userId) {
      onParticipantJoined();
    }
  }, [userId, onParticipantJoined]);

  useEffect(() => {
    const connect = async () => {
      try {
        const client = new SignalingClient(settings.signalingUrl);

        client.onMessage((message) => {
          if (message.type === 'user-joined') {
            handleUserJoined(message.userId);
          } else if (message.type === 'room-users' && message.users.length > 0) {
            // There are already users in the room
            const otherUsers = message.users.filter((id: string) => id !== userId);
            if (otherUsers.length > 0) {
              onParticipantJoined();
            }
          } else if (message.type === 'error') {
            setError(message.message);
          }
        });

        await client.connect();
        signalingRef.current = client;
        client.joinRoom(roomId, userId);
        setIsConnecting(false);
        console.log('[WaitingScreen] Connected to signaling server');
      } catch (err) {
        console.error('[WaitingScreen] Connection error:', err);
        setError('Failed to connect to server');
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      if (signalingRef.current) {
        signalingRef.current.leaveRoom(roomId, userId);
        signalingRef.current.disconnect();
      }
    };
  }, [settings.signalingUrl, roomId, userId, handleUserJoined, onParticipantJoined]);

  const handleCancel = useCallback(() => {
    if (signalingRef.current) {
      signalingRef.current.leaveRoom(roomId, userId);
      signalingRef.current.disconnect();
    }
    onCancel();
  }, [roomId, userId, onCancel]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={COLORS.textMuted} />
          <ThemeText variant="large" style={styles.title}>
            Connection Failed
          </ThemeText>
          <ThemeText variant="small" style={styles.subtitle}>
            {error}
          </ThemeText>
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
            onPress={onCancel}
          >
            <ThemeText variant="medium" style={styles.cancelButtonText}>
              Go Back
            </ThemeText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Avatar with ringing animation */}
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-outline" size={48} color={COLORS.textMuted} />
        </View>

        <ThemeText variant="large" style={styles.title}>
          {isConnecting ? 'Connecting...' : 'Waiting for participant'}
        </ThemeText>
        <ThemeText variant="small" style={styles.subtitle}>
          Share the room ID with others to join
        </ThemeText>

        {/* Room ID display */}
        <View style={styles.roomIdContainer}>
          <ThemeText variant="small" style={styles.roomIdLabel}>Room:</ThemeText>
          <ThemeText variant="medium" style={styles.roomIdValue}>{roomId}</ThemeText>
        </View>

        {/* Loading indicator */}
        <ActivityIndicator size="large" color={COLORS.textMuted} style={{ marginBottom: 40 }} />

        {/* Cancel button */}
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          onPress={handleCancel}
        >
          <ThemeText variant="medium" style={styles.cancelButtonText}>
            Cancel
          </ThemeText>
        </Pressable>
      </View>
    </View>
  );
});
