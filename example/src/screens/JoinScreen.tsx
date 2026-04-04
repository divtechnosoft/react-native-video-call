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
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../context';

interface JoinScreenProps {
  onJoinCall: (roomId: string, userId: string) => void;
  onOpenSettings: () => void;
}

export function JoinScreen({ onJoinCall, onOpenSettings }: JoinScreenProps) {
  const { settings } = useSettings();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  // Generate random user ID
  const generateUserId = () => `user_${Math.random().toString(36).substring(2, 8)}`;

  // Generate random room ID
  const generateRoomId = () => `room_${Math.random().toString(36).substring(2, 8)}`;

  const handleJoin = () => {
    const finalRoomId = roomId.trim() || generateRoomId();
    const finalUserId = userId.trim() || generateUserId();

    // Validate room ID
    if (finalRoomId.length < 3) {
      Alert.alert('Invalid Room ID', 'Room ID must be at least 3 characters');
      return;
    }

    // Validate user ID
    if (finalUserId.length < 3) {
      Alert.alert('Invalid Name', 'Name must be at least 3 characters');
      return;
    }

    onJoinCall(finalRoomId, finalUserId);
  };

  const handleRandomRoom = () => {
    setRoomId(generateRoomId());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Settings button */}
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <MaterialCommunityIcons name="cog" size={28} color="#888" />
        </TouchableOpacity>

        {/* Logo/Icon */}
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
              onChangeText={setRoomId}
              placeholder="Enter room ID"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <TouchableOpacity style={styles.randomButton} onPress={handleRandomRoom}>
              <MaterialCommunityIcons name="dice-5" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User ID Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>

        {/* Join Button */}
        <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.8}>
          <MaterialCommunityIcons name="video-outline" size={24} color="#fff" />
          <Text style={styles.joinButtonText}>Join Call</Text>
        </TouchableOpacity>

        {/* Server info */}
        <TouchableOpacity style={styles.serverInfo} onPress={onOpenSettings}>
          <MaterialCommunityIcons name="server" size={16} color="#555" />
          <Text style={styles.serverLabel}>Server:</Text>
          <Text style={styles.serverUrl} numberOfLines={1}>{settings.signalingUrl}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#555" />
        </TouchableOpacity>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  randomButton: {
    marginLeft: 12,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  serverLabel: {
    fontSize: 13,
    color: '#555',
    marginLeft: 6,
  },
  serverUrl: {
    fontSize: 13,
    color: '#4F46E5',
    marginLeft: 4,
    flex: 1,
  },
});
