/**
 * ErrorBanner Styles
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonPressed: {
    opacity: 0.7,
  },
});
