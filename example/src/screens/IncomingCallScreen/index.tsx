/**
 * IncomingCallScreen - Shows caller name, call type, Accept/Reject buttons
 */

import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeText } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

export interface IncomingCallData {
  roomId: string;
  callerUid: string;
  callerName: string;
  calleeUid: string;
  callType: 'audio' | 'video';
}

interface IncomingCallScreenProps {
  incomingCall: IncomingCallData;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallScreen({ incomingCall, onAccept, onReject }: IncomingCallScreenProps) {
  const insets = useSafeAreaInsets();

  const callTypeLabel = incomingCall.callType === 'video' ? 'Video Call' : 'Audio Call';
  const callTypeIcon = incomingCall.callType === 'video' ? 'video' : 'phone';

  const handleAccept = useCallback(() => {
    onAccept();
  }, [onAccept]);

  const handleReject = useCallback(() => {
    onReject();
  }, [onReject]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={52} color={COLORS.textSecondary} />
        </View>

        <ThemeText variant="large" style={styles.callerName}>
          {incomingCall.callerName}
        </ThemeText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 48 }}>
          <MaterialCommunityIcons name={callTypeIcon} size={18} color={COLORS.textMuted} />
          <ThemeText variant="small" style={styles.callTypeLabel}>
            Incoming {callTypeLabel}
          </ThemeText>
        </View>

        <View style={styles.buttonRow}>
          <View style={{ alignItems: 'center' }}>
            <Pressable
              style={({ pressed }) => [styles.acceptButton, pressed && styles.acceptButtonPressed]}
              onPress={handleAccept}
            >
              <MaterialCommunityIcons name="phone" size={30} color={COLORS.background} />
            </Pressable>
            <ThemeText variant="small" style={styles.buttonLabel}>
              Accept
            </ThemeText>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Pressable
              style={({ pressed }) => [styles.rejectButton, pressed && styles.rejectButtonPressed]}
              onPress={handleReject}
            >
              <MaterialCommunityIcons name="phone-hangup" size={30} color={COLORS.background} />
            </Pressable>
            <ThemeText variant="small" style={styles.buttonLabel}>
              Decline
            </ThemeText>
          </View>
        </View>
      </View>
    </View>
  );
}
