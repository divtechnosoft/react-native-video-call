/**
 * JoinScreen - Screen to enter room and start a call
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSettings } from '../context';

interface JoinScreenProps {
  onJoinCall: (roomId: string, userId: string) => void;
  onOpenSettings: () => void;
}

export function JoinScreen({ onJoinCall, onOpenSettings }: JoinScreenProps) {
  const { settings } = useSettings();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  // Generate random user ID if not set
  const getUserId = () => {
    if (userId.trim()) return userId.trim();
    return `user_${Math.random().toString(36).substring(2, 8)}`;
  };

  // Generate random room ID if not set
  const getRoomId = () => {
    if (roomId.trim()) return roomId.trim();
    return `room_${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleJoin = () => {
    onJoinCall(getRoomId(), getUserId());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Settings button */}
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Video Call</Text>
        <Text style={styles.subtitle}>Enter room details to start a call</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Room ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={roomId}
            onChangeText={setRoomId}
            placeholder="Leave empty for random room"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name (optional)</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="Leave empty for random name"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
          <Text style={styles.joinButtonText}>Join Call</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Share the Room ID with another person to start a video call
        </Text>

        {/* Server info */}
        <View style={styles.serverInfo}>
          <Text style={styles.serverLabel}>Server:</Text>
          <Text style={styles.serverUrl}>{settings.signalingUrl}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 48,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
  serverInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  serverLabel: {
    fontSize: 12,
    color: '#555',
  },
  serverUrl: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
  },
});
