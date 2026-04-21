/**
 * AddContactModal - Modal with name + UID inputs
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContacts } from '../../context/ContactsContext';
import { ThemeText, ThemeTextInput } from '../../components';
import { COLORS } from '../../config';
import { styles } from './style';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddContactModal({ visible, onClose }: AddContactModalProps) {
  const { addContact, contacts } = useContacts();
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');

  const isValid = name.trim().length >= 2 && uid.trim().length >= 1;

  const handleAdd = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedUid = uid.trim();

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }

    if (!trimmedUid) {
      Alert.alert('Invalid UID', 'Please enter a UID');
      return;
    }

    const exists = contacts.some((c) => c.uid === trimmedUid);
    if (exists) {
      Alert.alert('Duplicate', 'A contact with this UID already exists');
      return;
    }

    await addContact({ name: trimmedName, uid: trimmedUid });
    setName('');
    setUid('');
    onClose();
  }, [name, uid, contacts, addContact, onClose]);

  const handleClose = useCallback(() => {
    setName('');
    setUid('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <ThemeText variant="large" style={styles.title}>
            Add Contact
          </ThemeText>

          <View style={styles.inputGroup}>
            <ThemeText variant="small" style={styles.label}>
              Name *
            </ThemeText>
            <ThemeTextInput
              variant="medium"
              value={name}
              onChangeText={setName}
              placeholder="Contact name"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemeText variant="small" style={styles.label}>
              UID *
            </ThemeText>
            <ThemeTextInput
              variant="medium"
              value={uid}
              onChangeText={setUid}
              placeholder="Enter their UID"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              onPress={handleClose}
            >
              <ThemeText variant="medium">Cancel</ThemeText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                !isValid && styles.addButtonDisabled,
                pressed && isValid && styles.addButtonPressed,
              ]}
              onPress={isValid ? handleAdd : undefined}
              disabled={!isValid}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.background} />
              <ThemeText variant="medium" style={styles.addButtonText}>
                Add
              </ThemeText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
