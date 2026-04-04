/**
 * SettingsScreen - Configure signaling server URL
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../context';
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
    Alert.alert('Reset Settings', 'Reset signaling URL to default?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => setSignalingUrl('http://localhost:8080'),
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
              color={pressed ? '#4F46E5' : '#fff'}
            />
          )}
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Server Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="server" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Server Configuration</Text>
          </View>

          <Text style={styles.label}>Signaling Server URL</Text>
          <TextInput
            style={styles.input}
            value={signalingUrl}
            onChangeText={handleChangeUrl}
            placeholder="http://192.168.1.100:8080"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.hintBox}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#666" />
            <Text style={styles.hint}>
              For local testing, use your machine&apos;s IP address instead of localhost.{'\n'}
              Example: http://192.168.1.100:8080
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
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
                  color={pressed ? '#4F46E5' : '#888'}
                />
                <Text style={[styles.actionButtonText, pressed && styles.actionButtonTextPressed]}>
                  Reset to Default
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
              </>
            )}
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <Text style={styles.aboutText}>
            React Native Video Call{'\n'}
            Version 1.0.0{'\n'}{'\n'}
            A plug-and-play WebRTC video calling library for React Native.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
