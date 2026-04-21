/**
 * Example App for react-native-video-call
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, View, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, UserProvider, ContactsProvider, useUser } from './src/context';
import {
  EnterNameScreen,
  HomeScreen,
  JoinScreen,
  CallScreen,
  CallingScreen,
  CallingInfo,
  ContactsScreen,
  IncomingCallScreen,
  IncomingCallData,
  ProfileScreen,
  SettingsScreen,
  WaitingScreen,
} from './src/screens';
import { Contact } from './src/context/ContactsContext';
import { useSignalingConnection } from './src/hooks/useSignalingConnection';

type Screen =
  | 'enter-name'
  | 'home'
  | 'join'
  | 'waiting'
  | 'call'
  | 'calling'
  | 'incoming-call'
  | 'contacts'
  | 'profile'
  | 'settings';

interface CallInfo {
  roomId: string;
  userId: string;
  enableVideo?: boolean;
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
  const { user, isLoading } = useUser();
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [callingInfo, setCallingInfo] = useState<CallingInfo | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  // Determine initial screen once user data is loaded
  const resolvedScreen: Screen = currentScreen ?? (user ? 'home' : 'enter-name');

  const handleCallRequest = useCallback(
    (data: IncomingCallData) => {
      // Only show incoming call if we're on a non-call screen
      const callScreens: Screen[] = ['calling', 'incoming-call', 'waiting', 'call'];
      if (callScreens.includes(resolvedScreen)) {
        // Already in a call, auto-reject
        signaling.emitCallRejected({ roomId: data.roomId, callerUid: data.callerUid });
        return;
      }
      setIncomingCall(data);
      setCurrentScreen('incoming-call');
    },
    [resolvedScreen]
  );

  const handleCallAccepted = useCallback(
    (data: { roomId: string; callerUid: string }) => {
      if (callingInfo && data.roomId === callingInfo.roomId) {
        setCallInfo({
          roomId: callingInfo.roomId,
          userId: user?.userId ?? '',
          enableVideo: callingInfo.callType === 'video',
        });
        setCallingInfo(null);
        setCurrentScreen('waiting');
      }
    },
    [callingInfo, user?.userId]
  );

  const handleCallRejected = useCallback(
    (data: { roomId: string; callerUid: string }) => {
      if (callingInfo && data.roomId === callingInfo.roomId) {
        setCallingInfo(null);
        Alert.alert('Call Declined', 'The contact declined your call');
        setCurrentScreen('contacts');
      }
    },
    [callingInfo]
  );

  const handleCallCancelled = useCallback(
    (data: { roomId: string; calleeUid: string }) => {
      if (incomingCall && data.roomId === incomingCall.roomId) {
        setIncomingCall(null);
        setCurrentScreen('home');
      }
    },
    [incomingCall]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const signaling = useSignalingConnection({
    onCallRequest: handleCallRequest,
    onCallAccepted: handleCallAccepted,
    onCallRejected: handleCallRejected,
    onCallCancelled: handleCallCancelled,
  });

  // Join personal room on startup to receive incoming calls
  useEffect(() => {
    if (user?.userId && signaling.isConnected()) {
      signaling.joinRoom(user.userId, user.userId);
    }
  }, [user?.userId, signaling]);

  const handleNameComplete = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleJoinWithRoomId = useCallback(() => {
    setCurrentScreen('join');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleOpenProfile = useCallback(() => {
    setCurrentScreen('profile');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleMakeCall = useCallback(() => {
    setCurrentScreen('contacts');
  }, []);

  const handleBackFromContacts = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleCloseProfile = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleInitiateCall = useCallback(
    async (contact: Contact, callType: 'audio' | 'video') => {
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Camera and microphone permissions are required for calls. Please grant permissions in Settings.',
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

      const roomId = `${user?.userId}_${contact.uid}_${Date.now()}`;
      const info: CallingInfo = {
        contactName: contact.name,
        contactUid: contact.uid,
        callType,
        roomId,
      };

      setCallingInfo(info);

      // Join personal room and emit call-request
      signaling.joinRoom(user?.userId ?? '', user?.userId ?? '');
      signaling.emitCallRequest({
        roomId,
        callerUid: user?.userId ?? '',
        callerName: user?.name ?? '',
        calleeUid: contact.uid,
        callType,
      });

      setCurrentScreen('calling');
    },
    [user?.userId, user?.name, signaling]
  );

  const handleCancelCalling = useCallback(() => {
    if (callingInfo) {
      signaling.emitCallCancelled({
        roomId: callingInfo.roomId,
        calleeUid: callingInfo.contactUid,
      });
      setCallingInfo(null);
    }
    setCurrentScreen('contacts');
  }, [callingInfo, signaling]);

  const handleAcceptIncomingCall = useCallback(() => {
    if (incomingCall) {
      signaling.emitCallAccepted({
        roomId: incomingCall.roomId,
        callerUid: incomingCall.callerUid,
      });
      setCallInfo({
        roomId: incomingCall.roomId,
        userId: user?.userId ?? '',
        enableVideo: incomingCall.callType === 'video',
      });
      setIncomingCall(null);
      setCurrentScreen('waiting');
    }
  }, [incomingCall, user?.userId, signaling]);

  const handleRejectIncomingCall = useCallback(() => {
    if (incomingCall) {
      signaling.emitCallRejected({
        roomId: incomingCall.roomId,
        callerUid: incomingCall.callerUid,
      });
      setIncomingCall(null);
      setCurrentScreen('home');
    }
  }, [incomingCall, signaling]);

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
    setCurrentScreen('home');
  }, []);

  const handleCancelWaiting = useCallback(() => {
    setCallInfo(null);
    setCurrentScreen('home');
  }, []);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <>
      {resolvedScreen === 'enter-name' && (
        <EnterNameScreen onComplete={handleNameComplete} />
      )}

      {resolvedScreen === 'home' && (
        <HomeScreen
          onJoinWithRoomId={handleJoinWithRoomId}
          onMakeCall={handleMakeCall}
          onOpenProfile={handleOpenProfile}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {resolvedScreen === 'join' && (
        <JoinScreen onJoinCall={handleJoinCall} onOpenSettings={handleOpenSettings} onGoBack={handleBackToHome} />
      )}

      {resolvedScreen === 'calling' && callingInfo ? (
        <CallingScreen callingInfo={callingInfo} onCancel={handleCancelCalling} />
      ) : null}

      {resolvedScreen === 'incoming-call' && incomingCall ? (
        <IncomingCallScreen
          incomingCall={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      ) : null}

      {resolvedScreen === 'waiting' && callInfo ? (
        <WaitingScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          onParticipantJoined={handleParticipantJoined}
          onCancel={handleCancelWaiting}
        />
      ) : null}

      {resolvedScreen === 'call' && callInfo ? (
        <CallScreen
          roomId={callInfo.roomId}
          userId={callInfo.userId}
          enableVideo={callInfo.enableVideo}
          onEndCall={handleEndCall}
        />
      ) : null}

      {resolvedScreen === 'contacts' && (
        <ContactsScreen
          onGoBack={handleBackFromContacts}
          onMakeCall={handleInitiateCall}
        />
      )}

      {resolvedScreen === 'profile' && (
        <ProfileScreen onClose={handleCloseProfile} />
      )}

      {resolvedScreen === 'settings' && (
        <SettingsScreen onClose={handleCloseSettings} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <UserProvider>
          <ContactsProvider>
            <StatusBar barStyle="light-content" />
            <AppContent />
          </ContactsProvider>
        </UserProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
