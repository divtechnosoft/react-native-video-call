/**
 * App Configuration
 */

export const APP_CONFIG = {
  appName: 'Video Call',
  version: '1.0.0',
  defaultSignalingUrl: 'http://localhost:8080',
} as const;

export const COLORS = {
  // Background
  background: '#000000',
  black: '#000000',
  surface: '#1a1a1a',
  surfaceLight: '#2a2a2a',

  // Primary (white)
  primary: '#ffffff',
  primaryDark: '#cccccc',

  // Text
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#777777',
  textDark: '#555555',

  // Border
  border: '#333333',

  // Overlay
  overlayDark: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.85)',

  // Status (grayscale)
  error: '#666666',
  warning: '#888888',
  success: '#aaaaaa',
} as const;
