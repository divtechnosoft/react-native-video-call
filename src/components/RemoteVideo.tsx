/**
 * RemoteVideo Component - Displays remote participant's video stream
 */

import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { CallState } from '../types';

export interface RemoteVideoProps {
  stream: MediaStream | null;
  callState: CallState;
}

export function RemoteVideo({ stream, callState }: RemoteVideoProps) {
  // Show connecting state
  if (callState === 'connecting' || callState === 'reconnecting') {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.placeholderText}>
          {callState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
        </Text>
      </View>
    );
  }

  // Show failed state
  if (callState === 'failed') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Connection Failed</Text>
        <Text style={styles.subText}>Please try again</Text>
      </View>
    );
  }

  // Show ended state
  if (callState === 'ended' || callState === 'remote-ended') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          {callState === 'remote-ended' ? 'Call ended by other participant' : 'Call ended'}
        </Text>
      </View>
    );
  }

  // Show idle/waiting state
  if (!stream || callState === 'idle' || callState === 'requesting-permissions') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.waitingIcon}>📹</Text>
        <Text style={styles.placeholderText}>Waiting for participant...</Text>
      </View>
    );
  }

  // Show remote video
  return (
    <RTCView
      streamURL={stream.toURL()}
      style={styles.video}
      objectFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  waitingIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  subText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 8,
  },
});
