/**
 * PauseOverlay - Shown when call is paused (phone interruption or manual)
 */

import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PauseReason } from '../types';

export interface PauseOverlayProps {
  isPaused: boolean;
  isResuming: boolean;
  pauseReason?: PauseReason;
  isPhoneCallActive?: boolean;
  onResume: () => void;
  onEnd: () => void;
}

export function PauseOverlay({
  isPaused,
  isResuming,
  pauseReason,
  isPhoneCallActive,
  onResume,
  onEnd,
}: PauseOverlayProps) {
  if (!isPaused && !isResuming) return null;

  const isPhoneCall = pauseReason === 'phone-call';

  // Determine subtitle based on state
  const getSubtitle = () => {
    if (isResuming) return '';
    if (isPhoneCall) {
      return isPhoneCallActive
        ? 'Phone call in progress'
        : 'Phone call ended. Tap to resume.';
    }
    return 'Call Paused';
  };

  // Determine icon based on state
  const getIcon = () => {
    if (isResuming) return null;
    if (isPhoneCall) {
      return isPhoneCallActive ? 'phone-paused' : 'phone-incoming';
    }
    return 'phone-paused';
  };

  const subtitle = getSubtitle();
  const iconName = getIcon();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isResuming ? (
          <>
            <ActivityIndicator size="large" color="#ffffff" />
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons name="phone-incoming" size={20} color="#ffffff" />
                <Text style={styles.titleText}>Resuming Call...</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {iconName ? (
              <MaterialCommunityIcons name={iconName} size={48} color="#ffffff" />
            ) : null}
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons name="phone-missed" size={20} color="#FF9500" />
                <Text style={styles.titleText}>Call Paused</Text>
              </View>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>
            <View style={styles.buttons}>
              <Pressable
                style={({ pressed }) => [styles.button, styles.resumeButton, pressed && styles.buttonPressed]}
                onPress={onResume}
              >
                <MaterialCommunityIcons name="phone" size={28} color="#ffffff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.button, styles.endButton, pressed && styles.buttonPressed]}
                onPress={onEnd}
              >
                <MaterialCommunityIcons name="phone-hangup" size={28} color="#ffffff" />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 24,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#34C759',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
