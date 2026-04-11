/**
 * LocalVideo Component - Displays local video stream (self-view)
 */

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';

export interface LocalVideoProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export const LocalVideo = memo(function LocalVideo({ stream, isMuted, isCameraOff }: LocalVideoProps) {
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

      {/* Camera off overlay */}
      {isCameraOff && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Camera Off</Text>
        </View>
      )}

      {/* Muted indicator */}
      {isMuted && (
        <View style={styles.mutedIndicator}>
          <Text style={styles.mutedIcon}>🔇</Text>
        </View>
      )}
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
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
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
  mutedIcon: {
    fontSize: 12,
  },
});
