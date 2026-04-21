/**
 * ProfileScreen - Edit user name and view user ID
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useUser } from '../../context';
import { ThemeText, ThemeTextInput } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

interface ProfileScreenProps {
  onClose: () => void;
}

export function ProfileScreen({ onClose }: ProfileScreenProps) {
  const { user, updateName } = useUser();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.name ?? '');

  const handleCopyUserId = useCallback(() => {
    if (user?.userId) {
      Clipboard.setString(user.userId);
      Alert.alert('Copied', 'User ID copied to clipboard');
    }
  }, [user?.userId]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Required', 'Name cannot be empty');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }

    await updateName(trimmedName);
    Alert.alert('Saved', 'Profile updated successfully', [
      { text: 'OK', onPress: onClose },
    ]);
  }, [name, updateName, onClose]);

  const isNameValid = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={onClose}>
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={pressed ? COLORS.primary : COLORS.text}
            />
          )}
        </Pressable>
        <ThemeText variant="large" style={styles.title}>
          Profile
        </ThemeText>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={56} color={COLORS.primary} />
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <ThemeText variant="small" style={styles.label}>
            Display Name
          </ThemeText>
          <ThemeTextInput
            variant="medium"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
          />
        </View>

        {/* User ID (read-only) */}
        <View style={styles.inputGroup}>
          <ThemeText variant="small" style={styles.label}>
            User ID
          </ThemeText>
          <View style={styles.userIdRow}>
            <ThemeText variant="small" style={styles.userIdText} numberOfLines={1}>
              {user?.userId ?? ''}
            </ThemeText>
            <Pressable
              style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
              onPress={handleCopyUserId}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            !isNameValid && styles.saveButtonDisabled,
            pressed && isNameValid && styles.saveButtonPressed,
          ]}
          onPress={isNameValid ? handleSave : undefined}
          disabled={!isNameValid}
        >
          <MaterialCommunityIcons name="content-save" size={22} color={COLORS.background} />
          <ThemeText variant="medium" style={[styles.saveButtonText, { color: COLORS.background }]}>
            Save Profile
          </ThemeText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
