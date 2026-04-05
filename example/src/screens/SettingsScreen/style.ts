/**
 * SettingsScreen Styles
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    textAlign: 'center',
  },
  spacer: {
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  hint: {
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonPressed: {
    backgroundColor: COLORS.surfaceLight,
  },
  actionButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  actionButtonTextPressed: {
    color: COLORS.primary,
  },
  aboutText: {
    lineHeight: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  saveButtonText: {
    marginLeft: 8,
  },
});
