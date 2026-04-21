/**
 * ContactsScreen - List of contacts with audio/video call icons
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContacts, Contact } from '../../context/ContactsContext';
import { ThemeText } from '../../components';
import { COLORS } from '../../config';
import { AddContactModal } from '../../components/AddContactModal';
import { styles } from './style';

type CallType = 'audio' | 'video';

interface ContactsScreenProps {
  onGoBack: () => void;
  onMakeCall: (contact: Contact, callType: CallType) => void;
}

function ContactItem({
  contact,
  onCall,
  onRemove,
}: {
  contact: Contact;
  onCall: (callType: CallType) => void;
  onRemove: () => void;
}) {
  const truncatedUid =
    contact.uid.length > 8 ? `${contact.uid.substring(0, 8)}...` : contact.uid;

  const handleLongPress = useCallback(() => {
    Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  }, [contact.name, onRemove]);

  return (
    <Pressable
      style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View style={styles.contactAvatar}>
        <MaterialCommunityIcons name="account" size={24} color={COLORS.textSecondary} />
      </View>

      <View style={styles.contactInfo}>
        <ThemeText variant="medium" style={styles.contactName}>
          {contact.name}
        </ThemeText>
        <ThemeText variant="small" style={styles.contactUid} numberOfLines={1}>
          {truncatedUid}
        </ThemeText>
      </View>

      <View style={styles.callIcons}>
        <Pressable
          style={({ pressed }) => [styles.callIcon, pressed && styles.callIconPressed]}
          onPress={() => onCall('audio')}
        >
          <MaterialCommunityIcons name="phone" size={18} color={COLORS.textSecondary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.callIcon, pressed && styles.callIconPressed]}
          onPress={() => onCall('video')}
        >
          <MaterialCommunityIcons name="video" size={18} color={COLORS.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const MemoizedContactItem = React.memo(ContactItem);

export function ContactsScreen({ onGoBack, onMakeCall }: ContactsScreenProps) {
  const { contacts, removeContact } = useContacts();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCall = useCallback(
    (contact: Contact, callType: CallType) => {
      onMakeCall(contact, callType);
    },
    [onMakeCall]
  );

  const handleRemove = useCallback(
    (uid: string) => {
      removeContact(uid);
    },
    [removeContact]
  );

  const renderItem = useCallback(
    ({ item }: { item: Contact }) => (
      <MemoizedContactItem
        contact={item}
        onCall={(callType) => handleCall(item, callType)}
        onRemove={() => handleRemove(item.uid)}
      />
    ),
    [handleCall, handleRemove]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={onGoBack}>
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={pressed ? COLORS.primary : COLORS.text}
            />
          )}
        </Pressable>
        <ThemeText variant="large" style={styles.title}>
          Contacts
        </ThemeText>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          {({ pressed }) => (
            <MaterialCommunityIcons
              name="plus"
              size={28}
              color={pressed ? COLORS.primary : COLORS.text}
            />
          )}
        </Pressable>
      </View>

      {/* Contact List or Empty State */}
      {contacts.length > 0 ? (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={COLORS.textDark}
            style={styles.emptyIcon}
          />
          <ThemeText variant="large" style={styles.emptyTitle}>
            No Contacts
          </ThemeText>
          <ThemeText variant="small" style={styles.contactUid}>
            Add a contact to start making calls
          </ThemeText>
        </View>
      )}

      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}
