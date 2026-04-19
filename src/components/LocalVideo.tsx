/**
 * LocalVideo Component - Displays local video stream (self-view)
 */

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RTCView, MediaStream } from 'react-native-webrtc';

export interface LocalVideoProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export const LocalVideo = memo(function LocalVideo({ stream, isMuted, isCameraOff }: LocalVideoProps) {
  // Show placeholder when camera is off
  if (isCameraOff) {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="video-off" size={32} color="#ffffff" />
        <Text style={styles.placeholderText}>Camera Off</Text>
      </View>
    );
  }

  // Show placeholder when no stream
  if (!stream) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Camera Off</Text>
      </View>
    );
  }

  const streamURL = stream.toURL();
  if (!streamURL) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No Video</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RTCView
        streamURL={streamURL}
        style={styles.video}
        mirror={true}
        objectFit="cover"
        zOrder={1}
      />

      {/* Muted indicator */}
      {isMuted ? (
        <View style={styles.mutedIndicator}>
          <MaterialCommunityIcons name="microphone-off" size={14} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    gap: 8,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
  },
  mutedIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
});
