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
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../context';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { settings, updateSettings } = useSettings();
  const [signalingUrl, setSignalingUrl] = useState(settings.signalingUrl);

  const handleSave = async () => {
    const url = signalingUrl.trim();

    if (!url) {
      Alert.alert('Error', 'Signaling URL cannot be empty');
      return;
    }

    // Check if URL is valid
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
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Reset signaling URL to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => setSignalingUrl('http://localhost:8080'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
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
            onChangeText={setSignalingUrl}
            placeholder="http://192.168.1.100:8080"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.hintBox}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#666" />
            <Text style={styles.hint}>
              For local testing, use your machine's IP address instead of localhost.{'\n'}
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

          <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
            <MaterialCommunityIcons name="refresh" size={22} color="#888" />
            <Text style={styles.actionButtonText}>Reset to Default</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
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
  hintBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#888',
    marginLeft: 12,
    flex: 1,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
