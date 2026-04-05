/**
 * CallStatusOverlay Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: COLORS.overlayLight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    textAlign: 'center',
  },
});
