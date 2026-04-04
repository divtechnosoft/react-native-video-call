/**
 * ErrorBanner - Displays error messages
 */

import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
        onPress={onDismiss}
      >
        <MaterialCommunityIcons name="close" size={20} color="#fff" />
      </Pressable>
    </View>
  );
});
