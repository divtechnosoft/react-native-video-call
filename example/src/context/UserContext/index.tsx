/**
 * UserContext - Persistent user identity with AsyncStorage
 * Uses separate keys: app_uid and app_name
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UID_KEY = 'app_uid';
const NAME_KEY = 'app_name';

export interface UserProfile {
  userId: string;
  name: string;
}

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  saveUser: (user: UserProfile) => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [uid, name] = await AsyncStorage.multiGet([UID_KEY, NAME_KEY]);
        if (uid[1] && name[1]) {
          setUser({ userId: uid[1], name: name[1] });
        }
      } catch (error) {
        console.error('[User] Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const saveUser = useCallback(async (newUser: UserProfile) => {
    try {
      setUser(newUser);
      await AsyncStorage.multiSet([
        [UID_KEY, newUser.userId],
        [NAME_KEY, newUser.name],
      ]);
    } catch (error) {
      console.error('[User] Failed to save user:', error);
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const updated = { ...user, name };
      setUser(updated);
      await AsyncStorage.setItem(NAME_KEY, name);
    } catch (error) {
      console.error('[User] Failed to update name:', error);
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, isLoading, saveUser, updateName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
