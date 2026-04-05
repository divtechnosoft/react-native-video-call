/**
 * ErrorBanner - Displays error messages
 */

import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeText } from '../ThemeText';
import { COLORS } from '../../config';
import { styles } from './style';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner = memo(function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  // Don't render if message is empty (prevents crash)
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.text} />
      <ThemeText variant="small" style={styles.message} numberOfLines={3}>
        {message}
      </ThemeText>
      <Pressable
        style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
        onPress={onDismiss}
      >
        <MaterialCommunityIcons name="close" size={20} color={COLORS.text} />
      </Pressable>
    </View>
  );
});
