/**
 * Example App for react-native-video-call
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SettingsProvider } from './src/context';
import { JoinScreen, CallScreen, SettingsScreen } from './src/screens';

type Screen = 'join' | 'call' | 'settings';

interface CallInfo {
  roomId: string;
  userId: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('join');
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);

  const handleJoinCall = (roomId: string, userId: string) => {
    setCallInfo({ roomId, userId });
    setCurrentScreen('call');
  };

  const handleEndCall = () => {
    setCurrentScreen('join');
    setCallInfo(null);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleCloseSettings = () => {
    setCurrentScreen('join');
  };

  return (
    <SettingsProvider>
      <StatusBar barStyle="light-content" />

      {currentScreen === 'join' && (
        <JoinScreen onJoinCall={handleJoinCall} onOpenSettings={handleOpenSettings} />
      )}

      {currentScreen === 'call' && callInfo && (
        <CallScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          onEndCall={handleEndCall}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen onClose={handleCloseSettings} />
      )}
    </SettingsProvider>
  );
}
