/**
 * CallScreen - Screen displaying the video call
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VideoCall, CallState } from 'react-native-video-call';
import { CallStatusOverlay, ErrorBanner } from '../../components';
import { useSettings } from '../../context';
import { styles } from './style';

interface CallScreenProps {
  roomId: string;
  userId: string;
  onEndCall: () => void;
}

export function CallScreen({ roomId, userId, onEndCall }: CallScreenProps) {
  const { settings } = useSettings();
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleCallStateChange = useCallback(
    (state: CallState) => {
      setCallState(state);
      console.log('[CallScreen] Call state:', state);

      // Auto-redirect on ended states
      if (state === 'ended' || state === 'remote-ended') {
        const isRemote = state === 'remote-ended';
        setTimeout(() => {
          Alert.alert(
            'Call Ended',
            isRemote ? 'The other participant left the call' : 'The call has ended',
            [{ text: 'OK', onPress: onEndCall }]
          );
        }, 500);
      }
    },
    [onEndCall]
  );

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

      {/* Error message - use ternary to prevent crash */}
      {error ? (
        <ErrorBanner message={error} onDismiss={handleDismissError} />
      ) : null}
    </View>
  );
}
