/**
 * Controls Component - Call control buttons (mute, camera, speaker, end call)
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface ControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerEnabled: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

export function Controls({
  isMuted,
  isCameraOff,
  isSpeakerEnabled,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onEndCall,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      {/* Mute button */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isMuted ? styles.buttonActive : null,
          pressed ? styles.buttonPressed : null,
        ]}
        onPress={onToggleMute}
      >
        <MaterialCommunityIcons
          name={isMuted ? 'microphone-off' : 'microphone'}
          size={24}
          color="#ffffff"
        />
      </Pressable>

      {/* Camera toggle button */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isCameraOff ? styles.buttonActive : null,
          pressed ? styles.buttonPressed : null,
        ]}
        onPress={onToggleCamera}
      >
        <MaterialCommunityIcons
          name={isCameraOff ? 'video-off-outline' : 'video-outline'}
          size={24}
          color="#ffffff"
        />
      </Pressable>

      {/* Speaker toggle button - switches between loudspeaker and earpiece */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isSpeakerEnabled ? styles.buttonActive : null,
          pressed ? styles.buttonPressed : null,
        ]}
        onPress={onToggleSpeaker}
      >
        <MaterialCommunityIcons
          name={isSpeakerEnabled ? 'volume-high' : 'volume-off'}
          size={24}
          color="#ffffff"
        />
      </Pressable>

      {/* End call button */}
      <Pressable
        style={({ pressed }) => [styles.button, styles.endCallButton, pressed ? styles.buttonPressed : null]}
        onPress={onEndCall}
      >
        <MaterialCommunityIcons name="phone-hangup" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
});
