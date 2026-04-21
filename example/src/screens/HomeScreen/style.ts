/**
 * HomeScreen Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  userSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  userName: {
    marginBottom: 8,
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '100%',
  },
  userIdRowPressed: {
    backgroundColor: COLORS.surfaceLight,
  },
  userIdLabel: {
    marginRight: 4,
  },
  userIdText: {
    flex: 1,
    color: COLORS.primary,
    marginRight: 8,
  },
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionCardPressed: {
    backgroundColor: COLORS.surfaceLight,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    marginBottom: 2,
  },
  actionSubtitle: {
    color: COLORS.textMuted,
  },
});
