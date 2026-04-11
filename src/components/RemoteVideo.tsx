/**
 * RemoteVideo Component - Displays remote participant's video stream
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { CallState } from '../types';

export interface RemoteVideoProps {
  stream: MediaStream | null;
  callState: CallState;
  isRemoteCameraOff?: boolean;
  isRemoteMuted?: boolean;
}

export const RemoteVideo = memo(function RemoteVideo({
  stream,
  callState,
  isRemoteCameraOff = false,
  isRemoteMuted = false,
}: RemoteVideoProps) {
  // Show connecting state
  if (callState === 'connecting' || callState === 'reconnecting' || callState === 'resuming') {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#ffffff" />
        <View style={styles.textContainer}>
          <Text style={styles.connectingText}>
            {callState === 'reconnecting' ? 'Reconnecting...' : callState === 'resuming' ? 'Resuming...' : 'Connecting...'}
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

  // Show paused state
  if (callState === 'paused') {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="phone-paused" size={64} color="#888888" />
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>Call Paused</Text>
        </View>
      </View>
    );
  }

  const streamURL = stream.toURL();

  // Show remote video with camera-off overlay
  return (
    <View style={styles.container}>
      {streamURL ? (
        <RTCView
          streamURL={streamURL}
          style={styles.video}
          objectFit="cover"
          zOrder={0}
        />
      ) : null}

      {/* Camera off overlay */}
      {isRemoteCameraOff && (
        <View style={styles.cameraOffOverlay}>
          <View style={styles.cameraOffIcon}>
            <MaterialCommunityIcons name="video-off" size={48} color="#ffffff" />
          </View>
          <Text style={styles.cameraOffText}>Camera Off</Text>
        </View>
      )}

      {/* Muted indicator */}
      {isRemoteMuted && (
        <View style={styles.mutedIndicator}>
          <MaterialCommunityIcons name="microphone-off" size={20} color="#ffffff" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  connectingText: {
    color: '#ffffff',
    fontSize: 16,
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
  cameraOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraOffText: {
    color: '#888888',
    fontSize: 16,
  },
  mutedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 8,
  },
});
