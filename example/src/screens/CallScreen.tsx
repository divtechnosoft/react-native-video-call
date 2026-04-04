/**
 * CallScreen - Screen displaying the video call
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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

  const handleCallStateChange = (state: CallState) => {
    setCallState(state);
    console.log('[CallScreen] Call state:', state);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    console.error('[CallScreen] Error:', err);
  };

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

      {/* Room info */}
      <View style={styles.roomInfo}>
        <Text style={styles.roomLabel}>Room: {roomId}</Text>
        <Text style={styles.userLabel}>You: {userId}</Text>
      </View>

      {/* Call state indicator */}
      <CallStatusOverlay callState={callState} />

      {/* Error message */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
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
  roomInfo: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roomLabel: {
    color: '#fff',
    fontSize: 12,
  },
  userLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
