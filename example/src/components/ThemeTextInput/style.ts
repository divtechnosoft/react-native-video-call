/**
 * ThemeTextInput Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  medium: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  large: {
    fontSize: 18,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
