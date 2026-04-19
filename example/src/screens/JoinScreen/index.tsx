/**
 * JoinScreen - Screen to enter room and start a call
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../context';
import { ThemeText, ThemeTextInput } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

interface JoinScreenProps {
  onJoinCall: (roomId: string, userId: string) => void;
  onOpenSettings: () => void;
}

// Static room ID so you don't have to type it every time
const DEFAULT_ROOM_ID = 'room_123';

// Generate a random user name (e.g. "User-a7k3")
function generateRandomName(): string {
  const suffix = Math.random().toString(36).substring(2, 6);
  return `User-${suffix}`;
}

export function JoinScreen({ onJoinCall, onOpenSettings }: JoinScreenProps) {
  const { settings } = useSettings();
  const [roomId, setRoomId] = useState(DEFAULT_ROOM_ID);
  const [userId, setUserId] = useState(generateRandomName());

  const handleJoin = useCallback(() => {
    const trimmedRoomId = roomId.trim();
    const trimmedUserId = userId.trim();

    // Validate room ID
    if (!trimmedRoomId) {
      Alert.alert('Required', 'Please enter a Room ID');
      return;
    }

    if (trimmedRoomId.length < 3) {
      Alert.alert('Invalid Room ID', 'Room ID must be at least 3 characters');
      return;
    }

    // Validate name
    if (!trimmedUserId) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (trimmedUserId.length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }

    onJoinCall(trimmedRoomId, trimmedUserId);
  }, [roomId, userId, onJoinCall]);

  const handleRandomRoom = useCallback(() => {
    setRoomId(`room_${Math.random().toString(36).substring(2, 8)}`);
  }, []);

  const handleChangeRoomId = useCallback((text: string) => {
    setRoomId(text);
  }, []);

  const handleChangeUserId = useCallback((text: string) => {
    setUserId(text);
  }, []);

  const isFormValid = roomId.trim().length >= 3 && userId.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Settings button */}
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
          onPress={onOpenSettings}
        >
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={28}
              color={pressed ? COLORS.primary : COLORS.textSecondary}
            />
          )}
        </Pressable>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="video-outline" size={64} color={COLORS.primary} />
        </View>

        <ThemeText variant="large" style={styles.title}>
          Video Call
        </ThemeText>
        <ThemeText variant="small" style={styles.subtitle}>
          Enter room details to join a call
        </ThemeText>

        {/* Room ID Input */}
        <View style={styles.inputGroup}>
          <ThemeText variant="small" style={styles.label}>
            Room ID *
          </ThemeText>
          <View style={styles.inputRow}>
            <ThemeTextInput
              variant="medium"
              style={{ flex: 1 }}
              value={roomId}
              onChangeText={handleChangeRoomId}
              placeholder="Enter room ID"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Pressable
              style={({ pressed }) => [styles.randomButton, pressed && styles.buttonPressed]}
              onPress={handleRandomRoom}
            >
              {({ pressed }) => (
                <MaterialCommunityIcons
                  name="dice-5"
                  size={24}
                  color={pressed ? COLORS.textMuted : COLORS.text}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* User ID Input */}
        <View style={styles.inputGroup}>
          <ThemeText variant="small" style={styles.label}>
            Your Name *
          </ThemeText>
          <ThemeTextInput
            variant="medium"
            value={userId}
            onChangeText={handleChangeUserId}
            placeholder="Enter your name"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>

        {/* Join Button */}
        <Pressable
          style={({ pressed }) => [
            styles.joinButton,
            !isFormValid && styles.joinButtonDisabled,
            pressed && isFormValid && styles.joinButtonPressed,
          ]}
          onPress={isFormValid ? handleJoin : undefined}
          disabled={!isFormValid}
        >
          <MaterialCommunityIcons name="video-outline" size={24} color={COLORS.background} />
          <ThemeText variant="medium" style={[styles.joinButtonText, { color: COLORS.background }]}>
            Join Call
          </ThemeText>
        </Pressable>

        {/* Server info */}
        <Pressable
          style={({ pressed }) => [styles.serverInfo, pressed && styles.serverInfoPressed]}
          onPress={onOpenSettings}
        >
          <MaterialCommunityIcons name="server" size={16} color={COLORS.textDark} />
          <ThemeText variant="small" style={styles.serverLabel}>
            Server:
          </ThemeText>
          <ThemeText variant="small" style={styles.serverUrl} numberOfLines={1}>
            {settings.signalingUrl}
          </ThemeText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textDark} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
