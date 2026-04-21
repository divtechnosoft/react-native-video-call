/**
 * ProfileScreen Styles
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userIdText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 32,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textDark,
    opacity: 0.5,
  },
  saveButtonText: {
    marginLeft: 8,
  },
});
