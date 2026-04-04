/**
 * CallStatusOverlay - Displays current call state
 */

import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CallState } from 'react-native-video-call';
import { styles } from './style';

interface CallStatusOverlayProps {
  callState: CallState;
}

interface StateInfo {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
  showSpinner: boolean;
  color: string;
}

export function CallStatusOverlay({ callState }: CallStatusOverlayProps) {
  // Don't show anything for connected or idle states
  if (callState === 'connected' || callState === 'idle') {
    return null;
  }

  // Memoize state info to prevent recalculation
  const stateInfo: StateInfo = useMemo(() => {
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
  }, [callState]);

  return (
    <View style={styles.container}>
      {stateInfo.showSpinner ? (
        <ActivityIndicator size="small" color={stateInfo.color} />
      ) : (
        <MaterialCommunityIcons name={stateInfo.icon} size={20} color={stateInfo.color} />
      )}
      <Text style={[styles.text, { color: stateInfo.color }]}>{stateInfo.text}</Text>
    </View>
  );
}
