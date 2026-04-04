/**
 * CallStatusOverlay - Displays current call state
 */

import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { CallState } from 'react-native-video-call';

interface CallStatusOverlayProps {
  callState: CallState;
}

export function CallStatusOverlay({ callState }: CallStatusOverlayProps) {
  // Don't show anything for connected or idle states
  if (callState === 'connected' || callState === 'idle') {
    return null;
  }

  const getStateInfo = () => {
    switch (callState) {
      case 'requesting-permissions':
        return { text: 'Requesting permissions...', showSpinner: true };
      case 'connecting':
        return { text: 'Connecting...', showSpinner: true };
      case 'reconnecting':
        return { text: 'Reconnecting...', showSpinner: true };
      case 'failed':
        return { text: 'Connection failed', showSpinner: false };
      case 'ended':
        return { text: 'Call ended', showSpinner: false };
      case 'remote-ended':
        return { text: 'Remote user ended call', showSpinner: false };
      default:
        return { text: callState, showSpinner: false };
    }
  };

  const { text, showSpinner } = getStateInfo();

  return (
    <View style={styles.container}>
      {showSpinner && <ActivityIndicator size="small" color="#fff" />}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
