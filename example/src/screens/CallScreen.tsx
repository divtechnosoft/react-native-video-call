/**
 * CallScreen - Screen displaying the video call
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VideoCall, CallState } from 'react-native-video-call';
import { CallStatusOverlay } from '../components/CallStatusOverlay';
import { ErrorBanner } from '../components/ErrorBanner';
import { useSettings } from '../context';

interface CallScreenProps {
  roomId: string;
  userId: string;
  onEndCall: () => void;
}

export function CallScreen({ roomId, userId, onEndCall }: CallScreenProps) {
  const { settings } = useSettings();
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleCallStateChange = useCallback((state: CallState) => {
    setCallState(state);
    console.log('[CallScreen] Call state:', state);

    // Auto-redirect on ended states
    if (state === 'ended' || state === 'remote-ended') {
      setTimeout(() => {
        Alert.alert(
          'Call Ended',
          state === 'remote-ended' ? 'The other participant left the call' : 'The call has ended',
          [{ text: 'OK', onPress: onEndCall }]
        );
      }, 500);
    }
  }, [onEndCall]);

  const handleError = useCallback((err: Error) => {
    console.error('[CallScreen] Error:', err);
    setError(err.message || 'An unexpected error occurred');
  }, []);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <View style={styles.container}>
      <VideoCall
        roomId={roomId}
        userId={userId}
        signalingUrl={settings.signalingUrl}
        onCallStateChange={handleCallStateChange}
        onError={handleError}
        style={styles.videoCall}
      />

      {/* Top bar with room info */}
      <View style={styles.topBar}>
        <View style={styles.roomInfo}>
          <MaterialCommunityIcons name="video" size={14} color="#fff" />
          <Text style={styles.roomLabel}>{roomId}</Text>
        </View>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons name="account" size={14} color="#888" />
          <Text style={styles.userLabel}>{userId}</Text>
        </View>
      </View>

      {/* Call state indicator */}
      <CallStatusOverlay callState={callState} />

      {/* Error message */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={handleDismissError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoCall: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  roomLabel: {
    color: '#fff',
    fontSize: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  userLabel: {
    color: '#888',
    fontSize: 12,
  },
});
