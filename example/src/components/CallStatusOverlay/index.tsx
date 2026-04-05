/**
 * CallStatusOverlay - Displays current call state
 */

import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CallState } from 'react-native-video-call';
import { ThemeText } from '../ThemeText';
import { COLORS } from '../../config';
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
          color: COLORS.primary,
        };
      case 'connecting':
        return {
          icon: 'link-variant',
          text: 'Connecting...',
          showSpinner: true,
          color: COLORS.primary,
        };
      case 'reconnecting':
        return {
          icon: 'refresh',
          text: 'Reconnecting...',
          showSpinner: true,
          color: COLORS.warning,
        };
      case 'failed':
        return {
          icon: 'alert-circle',
          text: 'Connection failed',
          showSpinner: false,
          color: COLORS.error,
        };
      case 'ended':
        return {
          icon: 'phone-hangup',
          text: 'Call ended',
          showSpinner: false,
          color: COLORS.textMuted,
        };
      case 'remote-ended':
        return {
          icon: 'phone-missed',
          text: 'Remote user left',
          showSpinner: false,
          color: COLORS.textMuted,
        };
      default:
        return {
          icon: 'information',
          text: callState,
          showSpinner: false,
          color: COLORS.textSecondary,
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
      <ThemeText variant="small" style={[styles.text, { color: stateInfo.color }]}>
        {stateInfo.text}
      </ThemeText>
    </View>
  );
}
