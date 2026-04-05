/**
 * CallScreen Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  videoCall: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlayDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  roomLabel: {
    color: COLORS.text,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlayDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  userLabel: {
    color: COLORS.textSecondary,
  },
});
