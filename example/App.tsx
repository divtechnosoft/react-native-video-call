/**
 * Example App for react-native-video-call
 */

import React, { useState, useCallback } from 'react';
import { StatusBar, View, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { SettingsProvider } from './src/context';
import { JoinScreen, CallScreen, SettingsScreen, WaitingScreen } from './src/screens';

type Screen = 'join' | 'waiting' | 'call' | 'settings';

interface CallInfo {
  roomId: string;
  userId: string;
}

async function checkPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const hasCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    const hasMicrophone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return hasCamera && hasMicrophone;
  }
  return true;
}

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const hasCamera = results['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
      const hasMicrophone = results['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

      return hasCamera && hasMicrophone;
    } catch (err) {
      console.warn('[App] Permission request error:', err);
      return false;
    }
  }
  return true;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('join');
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);

  const handleJoinCall = useCallback(async (roomId: string, userId: string) => {
    // Check if permissions are already granted
    const hasPermissions = await checkPermissions();

    if (!hasPermissions) {
      // Request permissions
      const granted = await requestPermissions();

      if (!granted) {
        // Show alert to go to settings
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for video calls. Please grant permissions in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }
    }

    // Permissions granted, proceed to waiting screen
    setCallInfo({ roomId, userId });
    setCurrentScreen('waiting');
  }, []);

  const handleParticipantJoined = useCallback(() => {
    setCurrentScreen('call');
  }, []);

  const handleEndCall = useCallback(() => {
    setCallInfo(null);
    setCurrentScreen('join');
  }, []);

  const handleCancelWaiting = useCallback(() => {
    setCallInfo(null);
    setCurrentScreen('join');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setCurrentScreen('join');
  }, []);

  return (
    <>
      {currentScreen === 'join' && (
        <JoinScreen onJoinCall={handleJoinCall} onOpenSettings={handleOpenSettings} />
      )}

      {currentScreen === 'waiting' && callInfo ? (
        <WaitingScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          onParticipantJoined={handleParticipantJoined}
          onCancel={handleCancelWaiting}
        />
      ) : null}

      {currentScreen === 'call' && callInfo ? (
        <CallScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          onEndCall={handleEndCall}
        />
      ) : null}

      {currentScreen === 'settings' && (
        <SettingsScreen onClose={handleCloseSettings} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <StatusBar barStyle="light-content" />
      <AppContent />
    </SettingsProvider>
  );
}
