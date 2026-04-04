/**
 * SettingsScreen - Configure signaling server URL
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSettings } from '../context';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { settings, updateSettings } = useSettings();
  const [signalingUrl, setSignalingUrl] = useState(settings.signalingUrl);

  const handleSave = async () => {
    // Basic validation
    const url = signalingUrl.trim();
    if (!url) {
      Alert.alert('Error', 'Signaling URL cannot be empty');
      return;
    }

    // Check if URL is valid
    try {
      new URL(url);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL (e.g., http://192.168.1.100:8080)');
      return;
    }

    await updateSettings({ signalingUrl: url });
    Alert.alert('Success', 'Settings saved successfully', [
      { text: 'OK', onPress: onClose },
    ]);
  };

  const handleReset = () => {
    setSignalingUrl('http://localhost:8080');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.label}>Signaling Server URL</Text>
          <TextInput
            style={styles.input}
            value={signalingUrl}
            onChangeText={setSignalingUrl}
            placeholder="http://192.168.1.100:8080"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Enter the URL of your WebRTC signaling server.{'\n'}
            For local testing, use your machine's IP address instead of localhost.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 16,
    color: '#4F46E5',
  },
  settingGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  resetButtonText: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
