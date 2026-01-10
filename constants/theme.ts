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
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled: '#666666',

  // Primary colors (accents) - Light Blue Theme
  primary: '#4FC3F7',          // Light blue
  primaryVariant: '#29B6F6',   // Darker light blue
  secondary: '#03DAC6',
  secondaryVariant: '#00C4B4',

  // Status colors
  success: '#4CAF50',
  error: '#CF6679',
  warning: '#FFC107',
  info: '#2196F3',

  // UI elements
  border: '#333333',
  divider: '#2C2C2C',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Tab colors
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#4FC3F7',  // Light blue
  tabBackground: '#1E1E1E',

  // Card colors
  cardBackground: '#1E1E1E',
  cardBorder: '#333333',

  // Input colors
  inputBackground: '#2C2C2C',
  inputBorder: '#444444',
  inputBorderFocus: '#BB86FC',

  // Button colors
  buttonPrimary: '#4FC3F7',    // Light blue
  buttonSecondary: '#03DAC6',
  buttonDisabled: '#444444',
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
