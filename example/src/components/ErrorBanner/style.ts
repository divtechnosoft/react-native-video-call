/**
 * ErrorBanner Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonPressed: {
    opacity: 0.7,
  },
});
