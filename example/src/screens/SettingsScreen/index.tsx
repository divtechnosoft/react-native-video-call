/**
 * SettingsScreen - Configure signaling server URL
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../context';
import { ThemeText, ThemeTextInput } from '../../components';
import { COLORS, APP_CONFIG } from '../../config';
import { styles } from './style';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { settings, updateSettings } = useSettings();
  const [signalingUrl, setSignalingUrl] = useState(settings.signalingUrl);

  const handleSave = useCallback(async () => {
    const url = signalingUrl.trim();

    if (!url) {
      Alert.alert('Error', 'Signaling URL cannot be empty');
      return;
    }

    try {
      new URL(url);
    } catch {
      Alert.alert('Invalid URL', 'Please enter a valid URL\nExample: http://192.168.1.100:8080');
      return;
    }

    await updateSettings({ signalingUrl: url });
    Alert.alert('Saved', 'Settings saved successfully', [
      { text: 'OK', onPress: onClose },
    ]);
  }, [signalingUrl, updateSettings, onClose]);

  const handleReset = useCallback(() => {
    Alert.alert('Reset Settings', `Reset signaling URL to default? (${APP_CONFIG.defaultSignalingUrl})`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => setSignalingUrl(APP_CONFIG.defaultSignalingUrl),
      },
    ]);
  }, []);

  const handleChangeUrl = useCallback((text: string) => {
    setSignalingUrl(text);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
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
          Settings
        </ThemeText>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Server Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="server" size={20} color={COLORS.primary} />
            <ThemeText variant="medium" style={styles.sectionTitle}>
              Server Configuration
            </ThemeText>
          </View>

          <ThemeText variant="small" style={styles.label}>
            Signaling Server URL
          </ThemeText>
          <ThemeTextInput
            variant="medium"
            style={styles.input}
            value={signalingUrl}
            onChangeText={handleChangeUrl}
            placeholder="http://192.168.1.100:8080"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.hintBox}>
            <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.textMuted} />
            <ThemeText variant="small" style={styles.hint}>
              {Platform.OS === 'android'
                ? 'Android emulator uses 10.0.2.2 to reach host machine.\nDefault: http://10.0.2.2:8080'
                : 'iOS simulator uses localhost to reach host machine.\nDefault: http://localhost:8080'}
              {'\n\n'}For physical devices, use your machine&apos;s IP address.{'\n'}
              Example: http://192.168.1.100:8080
            </ThemeText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary} />
            <ThemeText variant="medium" style={styles.sectionTitle}>
              Quick Actions
            </ThemeText>
          </View>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={handleReset}
          >
            {({ pressed }) => (
              <>
                <MaterialCommunityIcons
                  name="refresh"
                  size={22}
                  color={pressed ? COLORS.primary : COLORS.textSecondary}
                />
                <ThemeText variant="medium" style={[styles.actionButtonText, pressed && styles.actionButtonTextPressed]}>
                  Reset to Default
                </ThemeText>
                <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textDark} />
              </>
            )}
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
            <ThemeText variant="medium" style={styles.sectionTitle}>
              About
            </ThemeText>
          </View>

          <ThemeText variant="small" style={styles.aboutText}>
            React Native Video Call{'\n'}
            Version 1.0.0{'\n'}{'\n'}
            A plug-and-play WebRTC video calling library for React Native.
          </ThemeText>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="content-save" size={22} color={COLORS.background} />
          <ThemeText variant="medium" style={[styles.saveButtonText, { color: COLORS.background }]}>
            Save Settings
          </ThemeText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
