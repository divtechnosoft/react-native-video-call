/**
 * Example App for react-native-video-call
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { JoinScreen, CallScreen } from './src/screens';

type Screen = 'join' | 'call';

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

  return (
    <>
      <StatusBar barStyle="light-content" />

      {currentScreen === 'join' && (
        <JoinScreen onJoinCall={handleJoinCall} />
      )}

      {currentScreen === 'call' && callInfo && (
        <CallScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}
