/**
 * UI kit — every primitive of the portfolio look lives here.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { BW, C, F, R, SH } from '@/constants/theme';

/* ---------- Screen: paper background + dot grid ---------- */

export function DotGrid() {
  return (
    <Svg style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Defs>
        <Pattern id="dots" width={20} height={20} patternUnits="userSpaceOnUse">
          <Circle cx={2} cy={2} r={1} fill={C.ink} opacity={0.1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={styles.screen}>
      <DotGrid />
      <SafeAreaView edges={['top']} style={[styles.flex, style]} {...rest}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/* ---------- Txt ---------- */

type Variant = keyof typeof text;

export function Txt({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: string }) {
  return <Text style={[text[v], color ? { color } : null, style]} {...rest} />;
}

/* ---------- Card ---------- */

export function Card({ style, dark, ...rest }: ViewProps & { dark?: boolean }) {
  return <View style={[styles.card, dark && styles.cardDark, style]} {...rest} />;
}

/* ---------- Button (press sinks into its shadow) ---------- */

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  kind?: 'primary' | 'secondary';
  arrow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, kind = 'primary', arrow, style, disabled, ...rest }: ButtonProps) {
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: primary ? C.accent : C.card },
        pressed && styles.sunk,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      <Text style={[text.cond, { color: primary ? C.paper : C.ink }]}>
        {label}
        {arrow ? '  →' : ''}
      </Text>
    </Pressable>
  );
}

/* ---------- Chip (filter / option) ---------- */

type ChipProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  active?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, active, color = C.accent, style, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, active && { backgroundColor: color }, pressed && styles.sunk, style]}
      {...rest}>
      <Text style={[text.cond, styles.chipText, active && { color: C.paper }]}>{label}</Text>
    </Pressable>
  );
}

/** One bordered bar split into options; the picked one fills with ink. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o, i) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          style={[styles.segItem, i > 0 && styles.segDivider, value === o.value && { backgroundColor: C.ink }]}>
          <Text style={[text.cond, styles.chipText, value === o.value && { color: C.paper }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Badge (tinted mono pill) and Stamp (rotated sticker) ---------- */

export function Badge({ label, color = C.accent, bg = C.accentLight }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[text.label, { color, fontFamily: F.monoBold }]}>{label}</Text>
    </View>
  );
}

export function Stamp({ label, bg = C.gold, rotate = -3, style }: { label: string; bg?: string; rotate?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.stamp, { backgroundColor: bg, transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Text style={[text.cond, styles.stampText]}>{label}</Text>
    </View>
  );
}

/* ---------- Headings ---------- */

/** Screen hero: mono eyebrow, handwritten line, Anton title with one word on an accent block. */
export function ScreenHeader({ eyebrow, hand, title, mark, right }: { eyebrow: string; hand?: string; title: string; mark: string; right?: React.ReactNode }) {
  return (
    <View style={styles.hero}>
      <View style={styles.rowBetween}>
        <Text style={text.label}>{eyebrow}</Text>
        {right}
      </View>
      {hand ? <Text style={[text.hand, { marginTop: 10 }]}>{hand}</Text> : null}
      <View style={styles.heroTitle} accessibilityRole="header" accessibilityLabel={`${title} ${mark}`}>
        <Text style={text.hero}>{title}</Text>
        <View style={styles.mark}>
          <Text style={[text.hero, { color: C.paper }]}>{mark}</Text>
        </View>
      </View>
    </View>
  );
}

/** Side heading: "02 / THIS WEEK" eyebrow in accent mono, then an Anton title and a count. */
export function SectionHeader({ n, eyebrow, title, count }: { n?: number; eyebrow?: string; title: string; count?: number }) {
  const lead = [n != null ? String(n).padStart(2, '0') : null, eyebrow].filter(Boolean).join(' / ');
  return (
    <View style={styles.section} accessibilityRole="header">
      {lead ? <Text style={[text.label, { color: C.accent }]}>{lead}</Text> : null}
      <View style={styles.sectionRow}>
        <Text style={text.title}>{title}</Text>
        <View style={styles.leader} />
        {count != null && <Text style={text.label}>{count}</Text>}
      </View>
    </View>
  );
}

/** Small caps label above a form field. */
export function FieldLabel({ children }: { children: string }) {
  return <Text style={[text.cond, styles.fieldLabel]}>{children}</Text>;
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.empty}>
      <Text style={text.title}>{title}</Text>
      <Text style={[text.mono, { color: C.mute }]}>{`> ${hint}`}</Text>
    </View>
  );
}

/* ---------- Round buttons ---------- */

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.sunk]}>
      <Ionicons name="add-sharp" size={30} color={C.paper} />
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color = C.ink }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: C.paper2 }]}>
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

/* ---------- Sheet (bottom modal) ---------- */

export function Sheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.rowBetween, { marginBottom: 14 }]}>
            <Text style={text.hero}>{title}</Text>
            <IconButton icon="close-sharp" onPress={onClose} label="Close" />
          </View>
          {children}
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Bordered text field for forms. */
export function Field({ style, ...rest }: TextInputProps) {
  return <TextInput placeholderTextColor={C.mute} style={[text.body, styles.field, style]} {...rest} />;
}

/* ---------- PromptInput: "> type here" ---------- */

export function PromptInput({ style, ...rest }: TextInputProps) {
  return (
    <View style={styles.prompt}>
      <Text style={[text.mono, { color: C.accent }]}>{'>'}</Text>
      <TextInput placeholderTextColor={C.mute} style={[text.mono, styles.promptInput, style]} {...rest} />
    </View>
  );
}

/* ---------- Checkbox ---------- */

export function Checkbox({ checked, onPress, label }: { checked: boolean; onPress?: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={[styles.check, checked && { backgroundColor: C.accent }]}>
      {checked && <Ionicons name="checkmark-sharp" size={18} color={C.paper} />}
    </Pressable>
  );
}

/* ---------- styles ---------- */

export const text = StyleSheet.create({
  display: { fontFamily: F.display, fontSize: 56, lineHeight: 62, letterSpacing: -1.1, color: C.ink, textTransform: 'uppercase' },
  hero: { fontFamily: F.display, fontSize: 40, lineHeight: 48, letterSpacing: -0.8, color: C.ink, textTransform: 'uppercase' },
  title: { fontFamily: F.display, fontSize: 24, lineHeight: 30, color: C.ink, textTransform: 'uppercase' },
  cond: { fontFamily: F.cond, fontSize: 18, letterSpacing: 0.8, color: C.ink, textTransform: 'uppercase' },
  body: { fontFamily: F.body, fontSize: 16, lineHeight: 24, color: C.body },
  bodyBold: { fontFamily: F.bodyBold, fontSize: 16, lineHeight: 24, color: C.ink },
  mono: { fontFamily: F.mono, fontSize: 14, color: C.ink },
  label: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: 'uppercase' },
  hand: { fontFamily: F.hand, fontSize: 22, color: C.teal },
});

const border = { borderWidth: BW, borderColor: C.ink } as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.paper },
  card: { ...border, backgroundColor: C.card, borderRadius: R.card, padding: 16, boxShadow: SH.card },
  cardDark: { backgroundColor: C.night },
  btn: {
    ...border,
    borderRadius: R.btn,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: SH.btn,
  },
  sunk: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: SH.pressed },
  disabled: { opacity: 0.45 },
  chip: {
    ...border,
    backgroundColor: C.card,
    borderRadius: R.chip,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    boxShadow: SH.sm,
  },
  chipText: { fontSize: 15 },
  seg: { ...border, flexDirection: 'row', borderRadius: R.btn, overflow: 'hidden', backgroundColor: C.card, boxShadow: SH.sm, marginTop: 20, marginRight: 4 },
  segItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  segDivider: { borderLeftWidth: BW, borderColor: C.ink },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  stamp: { ...border, alignSelf: 'flex-start', borderRadius: R.chip, paddingVertical: 5, paddingHorizontal: 12, boxShadow: SH.sm },
  stampText: { fontSize: 14, letterSpacing: 1.2 },
  section: { gap: 2, marginTop: 26, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { marginBottom: 18 },
  heroTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, marginTop: 2 },
  mark: { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 8, transform: [{ rotate: '-2deg' }] },
  fieldLabel: { fontSize: 15, marginBottom: 8, marginTop: 18 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 20 },
  fab: {
    ...border,
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: SH.btn,
  },
  iconBtn: {
    ...border,
    width: 40,
    height: 40,
    borderRadius: R.chip,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25, 22, 20, 0.55)' },
  sheet: {
    backgroundColor: C.paper,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: BW,
    borderBottomWidth: 0,
    borderColor: C.ink,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '92%',
  },
  sheetFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16 },
  field: { ...border, backgroundColor: C.card, borderRadius: R.btn, paddingHorizontal: 14, paddingVertical: 12, minHeight: 50, color: C.ink },
  leader: { flex: 1, borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: C.mute, marginBottom: 6 },
  prompt: {
    ...border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 16,
    minHeight: 52,
    boxShadow: SH.card,
  },
  promptInput: { flex: 1, paddingVertical: 12, outlineWidth: 0 },
  check: {
    ...border,
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
