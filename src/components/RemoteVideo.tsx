/**
 * RemoteVideo Component - Displays remote participant's video stream
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { CallState } from '../types';

export interface RemoteVideoProps {
  stream: MediaStream | null;
  callState: CallState;
}

export const RemoteVideo = memo(function RemoteVideo({ stream, callState }: RemoteVideoProps) {

  // Show connecting state
  if (callState === 'connecting' || callState === 'reconnecting') {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#ffffff" />
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>
            {callState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
          </Text>
        </View>
      </View>
    );
  }

  // Show failed state
  if (callState === 'failed') {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#888888" />
        <View style={styles.textContainer}>
          <Text style={styles.errorText}>Connection Failed</Text>
          <Text style={styles.subText}>Please try again</Text>
        </View>
      </View>
    );
  }

  // Show ended state
  if (callState === 'ended' || callState === 'remote-ended') {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="phone-missed" size={64} color="#888888" />
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>
            {callState === 'remote-ended' ? 'Call ended by other participant' : 'Call ended'}
          </Text>
        </View>
      </View>
    );
  }

  // Show idle/waiting state
  if (!stream || callState === 'idle' || callState === 'requesting-permissions') {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="account-outline" size={80} color="#555555" />
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>Waiting for participant...</Text>
        </View>
      </View>
    );
  }

  const streamURL = stream.toURL();
  if (!streamURL) {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="video-off-outline" size={64} color="#888888" />
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>No video stream</Text>
        </View>
      </View>
    );
  }

  // Show remote video
  return (
    <RTCView
      streamURL={streamURL}
      style={styles.video}
      objectFit="cover"
      zOrder={Platform.OS === 'ios' ? 0 : 0}
    />
  );
});

const styles = StyleSheet.create({
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#aaaaaa',
    fontSize: 16,
  },
  errorText: {
    color: '#888888',
    fontSize: 18,
    fontWeight: '600',
  },
  subText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
  },
});
