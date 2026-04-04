/**
 * Controls Component - Call control buttons (mute, camera, end call)
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

export interface ControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export function Controls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      {/* Mute button */}
      <TouchableOpacity
        style={[styles.button, isMuted && styles.buttonActive]}
        onPress={onToggleMute}
      >
        <Text style={styles.buttonIcon}>{isMuted ? '🔇' : '🎤'}</Text>
        <Text style={styles.buttonLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
      </TouchableOpacity>

      {/* Camera toggle button */}
      <TouchableOpacity
        style={[styles.button, isCameraOff && styles.buttonActive]}
        onPress={onToggleCamera}
      >
        <Text style={styles.buttonIcon}>{isCameraOff ? '📷' : '📹'}</Text>
        <Text style={styles.buttonLabel}>{isCameraOff ? 'Camera On' : 'Camera Off'}</Text>
      </TouchableOpacity>

      {/* End call button */}
      <TouchableOpacity
        style={[styles.button, styles.endCallButton]}
        onPress={onEndCall}
      >
        <Text style={styles.buttonIcon}>📞</Text>
        <Text style={styles.buttonLabel}>End</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  buttonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
});
