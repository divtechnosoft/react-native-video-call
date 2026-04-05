/**
 * ThemeTextInput - Centralized text input component with consistent styling
 */

import React, { memo } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { COLORS } from '../../config';
import { styles } from './style';

type ThemeTextInputVariant = 'small' | 'medium' | 'large';

type ThemeTextInputProps = TextInputProps & {
  variant?: ThemeTextInputVariant;
};

export const ThemeTextInput = memo(function ThemeTextInput({
  variant = 'medium',
  style,
  placeholderTextColor = COLORS.textMuted,
  ...rest
}: ThemeTextInputProps) {
  return (
    <TextInput
      style={[styles[variant], style]}
      placeholderTextColor={placeholderTextColor}
      {...rest}
    />
  );
});
