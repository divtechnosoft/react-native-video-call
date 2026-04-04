/**
 * JoinScreen - Screen to enter room and start a call
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../context';
import { styles } from './style';

interface JoinScreenProps {
  onJoinCall: (roomId: string, userId: string) => void;
  onOpenSettings: () => void;
}

export function JoinScreen({ onJoinCall, onOpenSettings }: JoinScreenProps) {
  const { settings } = useSettings();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  // Memoized generated IDs
  const generatedRoomId = useMemo(
    () => `room_${Math.random().toString(36).substring(2, 8)}`,
    []
  );
  const generatedUserId = useMemo(
    () => `user_${Math.random().toString(36).substring(2, 8)}`,
    []
  );

  const handleJoin = useCallback(() => {
    const finalRoomId = roomId.trim() || generatedRoomId;
    const finalUserId = userId.trim() || generatedUserId;

    if (finalRoomId.length < 3) {
      Alert.alert('Invalid Room ID', 'Room ID must be at least 3 characters');
      return;
    }

    if (finalUserId.length < 3) {
      Alert.alert('Invalid Name', 'Name must be at least 3 characters');
      return;
    }

    onJoinCall(finalRoomId, finalUserId);
  }, [roomId, userId, generatedRoomId, generatedUserId, onJoinCall]);

  const handleRandomRoom = useCallback(() => {
    setRoomId(`room_${Math.random().toString(36).substring(2, 8)}`);
  }, []);

  const handleChangeRoomId = useCallback((text: string) => {
    setRoomId(text);
  }, []);

  const handleChangeUserId = useCallback((text: string) => {
    setUserId(text);
  }, []);

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
              name="cog"
              size={28}
              color={pressed ? '#4F46E5' : '#888'}
            />
          )}
        </Pressable>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="video" size={64} color="#4F46E5" />
        </View>

        <Text style={styles.title}>Video Call</Text>
        <Text style={styles.subtitle}>Enter room details or use random values</Text>

        {/* Room ID Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Room ID</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={roomId}
              onChangeText={handleChangeRoomId}
              placeholder="Enter room ID"
              placeholderTextColor="#666"
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
                  color={pressed ? '#818CF8' : '#4F46E5'}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* User ID Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={handleChangeUserId}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>

        {/* Join Button */}
        <Pressable
          style={({ pressed }) => [styles.joinButton, pressed && styles.joinButtonPressed]}
          onPress={handleJoin}
        >
          <MaterialCommunityIcons name="video-outline" size={24} color="#fff" />
          <Text style={styles.joinButtonText}>Join Call</Text>
        </Pressable>

        {/* Server info */}
        <Pressable
          style={({ pressed }) => [styles.serverInfo, pressed && styles.serverInfoPressed]}
          onPress={onOpenSettings}
        >
          <MaterialCommunityIcons name="server" size={16} color="#555" />
          <Text style={styles.serverLabel}>Server:</Text>
          <Text style={styles.serverUrl} numberOfLines={1}>
            {settings.signalingUrl}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#555" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
