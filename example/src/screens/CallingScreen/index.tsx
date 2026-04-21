/**
 * CallingScreen - Shows contact name, call type, cancel button
 */

import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeText } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

export interface CallingInfo {
  contactName: string;
  contactUid: string;
  callType: 'audio' | 'video';
  roomId: string;
}

interface CallingScreenProps {
  callingInfo: CallingInfo;
  onCancel: () => void;
}

export function CallingScreen({ callingInfo, onCancel }: CallingScreenProps) {
  const insets = useSafeAreaInsets();

  const callTypeLabel = callingInfo.callType === 'video' ? 'Video Call' : 'Audio Call';
  const callTypeIcon = callingInfo.callType === 'video' ? 'video-outline' : 'phone-outline';

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={52} color={COLORS.textSecondary} />
        </View>

        <ThemeText variant="large" style={styles.contactName}>
          {callingInfo.contactName}
        </ThemeText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <MaterialCommunityIcons name={callTypeIcon} size={18} color={COLORS.textMuted} />
          <ThemeText variant="small" style={styles.callTypeLabel}>
            {callTypeLabel}
          </ThemeText>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          onPress={handleCancel}
        >
          <MaterialCommunityIcons name="phone-hangup" size={22} color={COLORS.background} />
          <ThemeText variant="medium" style={styles.cancelButtonText}>
            Cancel
          </ThemeText>
        </Pressable>
      </View>
    </View>
  );
}
