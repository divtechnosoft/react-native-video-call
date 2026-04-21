/**
 * HomeScreen - Main hub after user identity is set
 */

import React, { useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useUser } from '../../context';
import { ThemeText } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

interface HomeScreenProps {
  onJoinWithRoomId: () => void;
  onMakeCall: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function HomeScreen({ onJoinWithRoomId, onMakeCall, onOpenProfile, onOpenSettings }: HomeScreenProps) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const truncatedUid = user?.userId
    ? user.userId.length > 8
      ? `${user.userId.substring(0, 8)}...`
      : user.userId
    : '';

  const handleCopyUserId = useCallback(() => {
    if (user?.userId) {
      Clipboard.setString(user.userId);
      Alert.alert('Copied', 'UID copied to clipboard');
    }
  }, [user?.userId]);

  const handleMakeCall = useCallback(() => {
    onMakeCall();
  }, [onMakeCall]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onOpenProfile}
        >
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={28}
              color={pressed ? COLORS.primary : COLORS.textSecondary}
            />
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onOpenSettings}
        >
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={28}
              color={pressed ? COLORS.primary : COLORS.textSecondary}
            />
          )}
        </Pressable>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
        </View>
        <ThemeText variant="large" style={styles.userName}>
          {user?.name ?? 'User'}
        </ThemeText>
        <Pressable
          style={({ pressed }) => [styles.userIdRow, pressed && styles.userIdRowPressed]}
          onPress={handleCopyUserId}
        >
          <ThemeText variant="small" style={styles.userIdLabel}>
            UID:
          </ThemeText>
          <ThemeText variant="small" style={styles.userIdText} numberOfLines={1}>
            {truncatedUid}
          </ThemeText>
          <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Actions */}
      <View style={[styles.actionsSection, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={onJoinWithRoomId}
        >
          <MaterialCommunityIcons name="video-outline" size={32} color={COLORS.primary} />
          <View style={styles.actionTextContainer}>
            <ThemeText variant="medium" style={styles.actionTitle}>
              Join with Room ID
            </ThemeText>
            <ThemeText variant="small" style={styles.actionSubtitle}>
              Enter a room ID to join a call
            </ThemeText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textDark} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={handleMakeCall}
        >
          <MaterialCommunityIcons name="phone-outline" size={32} color={COLORS.primary} />
          <View style={styles.actionTextContainer}>
            <ThemeText variant="medium" style={styles.actionTitle}>
              Make a Call
            </ThemeText>
            <ThemeText variant="small" style={styles.actionSubtitle}>
              Call your contacts
            </ThemeText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textDark} />
        </Pressable>
      </View>
    </View>
  );
}
