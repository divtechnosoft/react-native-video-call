/**
 * CallScreen - Screen displaying the video call
 */

import React, { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VideoCall, CallState } from 'react-native-video-call';
import { CallStatusOverlay, ErrorBanner, ThemeText } from '../../components';
import { useSettings } from '../../context';
import { COLORS } from '../../config';
import { styles } from './style';

interface CallScreenProps {
  roomId: string;
  userId: string;
  enableVideo?: boolean;
  onEndCall: () => void;
}

export function CallScreen({ roomId, userId, enableVideo = true, onEndCall }: CallScreenProps) {
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Note: iOS Simulator has WebRTC audio limitations
  // If experiencing crashes on iOS Simulator, test on a physical device
  // or check if audio needs to be disabled

  const handleCallStateChange = useCallback(
    (state: CallState) => {
      setCallState(state);
      console.log('[CallScreen] Call state:', state);

      // Clear error when state changes
      if (state !== 'failed') {
        setError(null);
      }

      // Auto-redirect on ended states
      if (state === 'ended' || state === 'remote-ended') {
        setTimeout(() => {
          onEndCall();
        }, 2000);
      }
    },
    [onEndCall]
  );

  const handleError = useCallback((err: Error) => {
    console.error('[CallScreen] Error:', err);
    const errorMessage = err.message || 'An unexpected error occurred';
    setError(errorMessage);
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
        enableVideo={enableVideo}
        onCallStateChange={handleCallStateChange}
        onError={handleError}
        style={styles.videoCall}
      />

      {/* Top bar with room info */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.roomInfo}>
          <MaterialCommunityIcons name="video-outline" size={16} color={COLORS.text} />
          <ThemeText variant="small" style={styles.roomLabel}>{roomId}</ThemeText>
        </View>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
          <ThemeText variant="small" style={styles.userLabel}>{userId}</ThemeText>
        </View>
      </View>

      {/* Call state indicator */}
      <CallStatusOverlay callState={callState} />

      {/* Error message */}
      {error ? (
        <ErrorBanner message={error} onDismiss={handleDismissError} />
      ) : null}
    </View>
  );
}
