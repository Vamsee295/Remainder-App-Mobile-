import { Appearance } from 'react-native';

/**
 * Design tokens — taken from vamsee.tech (paper / ink / burnt orange, hard shadows).
 */
const LIGHT = {
  paper: '#f5efe6',
  paper2: '#ece3d4',
  card: '#fbf8f2',
  ink: '#191614',
  body: '#191614c7',
  mute: '#1916148f',
  line: '#19161424',
  accent: '#c8603a',
  accentD: '#a34a28',
  accentL: '#f08a5d',
  accentLight: '#f6d9cb',
  accentMuted: '#fbede5',
  teal: '#2f6f6a',
  tealLight: '#cfe6df',
  mint: '#7cc9b2',
  gold: '#e3a72f',
  night: '#151311',
  shadow: '#191614',
};

/**
 * Night paper: dark background, paper-coloured ink. `paper` and `night` swap, so text that sits on an
 * ink/accent fill (written as C.paper) and the one dark highlight card (C.night) stay readable.
 */
const DARK: typeof LIGHT = {
  paper: '#151311',
  paper2: '#25201c',
  card: '#1e1a17',
  ink: '#f5efe6',
  body: '#f5efe6c7',
  mute: '#f5efe68f',
  line: '#f5efe624',
  accent: '#d46a43',
  accentD: '#e07a52',
  accentL: '#f08a5d',
  accentLight: '#4a2a1d',
  accentMuted: '#2e1d15',
  teal: '#5fb3aa',
  tealLight: '#1d3734',
  mint: '#2f6f6a',
  gold: '#e3a72f',
  night: '#f0e8dc',
  shadow: '#f5efe655', // a soft paper-coloured hard shadow; pure black disappears on the dark background
};

/**
 * Picked once at start-up from the phone's light / dark setting: every screen builds its styles from these
 * when it loads. ponytail: switching the phone's theme applies the next time the app opens; make the palette
 * reactive (useColorScheme in each screen) if live switching ever matters.
 */
export const isDark = Appearance.getColorScheme() === 'dark';
export const C = isDark ? DARK : LIGHT;

export const F = {
  display: 'Anton_400Regular',
  cond: 'BarlowCondensed_700Bold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
  hand: 'Caveat_400Regular',
};

export const BW = 2.5;
export const R = { card: 16, btn: 12, chip: 8, badge: 4 };
export const SH = {
  card: `5px 6px 0 ${C.shadow}`,
  btn: `4px 5px 0 ${C.shadow}`,
  sm: `3px 4px 0 ${C.shadow}`,
  pressed: `1px 1px 0 ${C.shadow}`,
};
