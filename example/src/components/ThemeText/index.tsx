/**
 * ThemeText - Centralized text component with consistent styling
 */

import React, { memo } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS } from '../../config';

type ThemeTextVariant = 'small' | 'medium' | 'large';

type ThemeTextProps = TextProps & {
  variant?: ThemeTextVariant;
};

const variantStyles = StyleSheet.create({
  small: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  medium: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  large: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export const ThemeText = memo(function ThemeText({
  variant = 'medium',
  style,
  children,
  ...rest
}: ThemeTextProps) {
  return (
    <Text style={[variantStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
});
