/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Dark Theme Only - Remainder App
 * This app uses a pure dark theme with white bold text
 */

import { Platform } from 'react-native';

export const Colors = {
  // Main backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#E0E0E0',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textDisabled: '#9E9E9E',

  // Primary colors (accents) - Light Blue Theme
  primary: '#007AFF',          // Standard blue
  primaryVariant: '#0056D2',   // Darker blue
  secondary: '#03DAC6',
  secondaryVariant: '#018786',

  // Status colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FFCC00',
  info: '#007AFF',

  // UI elements
  border: '#E0E0E0',
  divider: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Tab colors
  tabIconDefault: '#8E8E93',
  tabIconSelected: '#007AFF',
  tabBackground: '#FFFFFF',

  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',

  // Input colors
  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#007AFF',

  // Button colors
  buttonPrimary: '#007AFF',
  buttonSecondary: '#03DAC6',
  buttonDisabled: '#E0E0E0',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
