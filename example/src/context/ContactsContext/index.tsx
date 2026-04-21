/**
 * ContactsContext - Persistent contacts with AsyncStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = 'contacts';

export interface Contact {
  name: string;
  uid: string;
}

interface ContactsContextValue {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (contact: Contact) => Promise<void>;
  removeContact: (uid: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const raw = await AsyncStorage.getItem(CONTACTS_KEY);
        if (raw) {
          setContacts(JSON.parse(raw));
        }
      } catch (error) {
        console.error('[Contacts] Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, []);

  const addContact = useCallback(async (contact: Contact) => {
    try {
      const updated = [...contacts, contact];
      setContacts(updated);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[Contacts] Failed to add:', error);
    }
  }, [contacts]);

  const removeContact = useCallback(async (uid: string) => {
    try {
      const updated = contacts.filter((c) => c.uid !== uid);
      setContacts(updated);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[Contacts] Failed to remove:', error);
    }
  }, [contacts]);

  return (
    <ContactsContext.Provider value={{ contacts, isLoading, addContact, removeContact }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider');
  }
  return context;
}
