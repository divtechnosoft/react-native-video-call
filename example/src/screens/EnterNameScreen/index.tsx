/**
 * EnterNameScreen - First-launch screen to set up user identity
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../context';
import { ThemeText, ThemeTextInput } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

interface EnterNameScreenProps {
  onComplete: () => void;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function EnterNameScreen({ onComplete }: EnterNameScreenProps) {
  const { saveUser } = useUser();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');

  const handleContinue = useCallback(async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }

    await saveUser({ userId: generateUUID(), name: trimmedName });
    onComplete();
  }, [name, saveUser, onComplete]);

  const isNameValid = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="account-circle-outline" size={80} color={COLORS.primary} />
        </View>

        <ThemeText variant="large" style={styles.title}>
          Welcome
        </ThemeText>
        <ThemeText variant="small" style={styles.subtitle}>
          Enter your name to get started
        </ThemeText>

        <View style={styles.inputGroup}>
          <ThemeText variant="small" style={styles.label}>
            Your Name *
          </ThemeText>
          <ThemeTextInput
            variant="medium"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            autoFocus
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !isNameValid && styles.continueButtonDisabled,
            pressed && isNameValid && styles.continueButtonPressed,
          ]}
          onPress={isNameValid ? handleContinue : undefined}
          disabled={!isNameValid}
        >
          <ThemeText variant="medium" style={[styles.continueButtonText, { color: COLORS.background }]}>
            Continue
          </ThemeText>
          <MaterialCommunityIcons name="arrow-right" size={22} color={COLORS.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
