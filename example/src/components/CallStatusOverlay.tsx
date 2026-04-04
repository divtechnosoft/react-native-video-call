/**
 * CallStatusOverlay - Displays current call state
 */

import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        return {
          icon: 'key',
          text: 'Requesting permissions...',
          showSpinner: true,
          color: '#4F46E5',
        };
      case 'connecting':
        return {
          icon: 'link-variant',
          text: 'Connecting...',
          showSpinner: true,
          color: '#4F46E5',
        };
      case 'reconnecting':
        return {
          icon: 'refresh',
          text: 'Reconnecting...',
          showSpinner: true,
          color: '#F59E0B',
        };
      case 'failed':
        return {
          icon: 'alert-circle',
          text: 'Connection failed',
          showSpinner: false,
          color: '#EF4444',
        };
      case 'ended':
        return {
          icon: 'phone-hangup',
          text: 'Call ended',
          showSpinner: false,
          color: '#6B7280',
        };
      case 'remote-ended':
        return {
          icon: 'phone-missed',
          text: 'Remote user left',
          showSpinner: false,
          color: '#6B7280',
        };
      default:
        return {
          icon: 'information',
          text: callState,
          showSpinner: false,
          color: '#888',
        };
    }
  };

  const { icon, text, showSpinner, color } = getStateInfo();

  return (
    <View style={styles.container}>
      {showSpinner ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      )}
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
