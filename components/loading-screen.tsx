import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { DotGrid, Txt } from '@/components/kit';
import { BW, C, F, SH } from '@/constants/theme';

const BLOCKS = [C.accent, C.teal, C.gold];
const HOLD_MS = 1400; // ponytail: fixed intro length; tie it to data loading if startup ever gets slow.

/** Startup intro in the portfolio style: "GET IT DONE." stamp pops in, three blocks hop, then it fades away. */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const hops = useRef(BLOCKS.map(() => new Animated.Value(0))).current;
  // Web reports fonts "loaded" before the files arrive, so the intro flashed in a fallback serif first.
  // Native already waits for the font files in _layout, so it starts ready.
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (ready) return;
    const fonts = [F.display, F.mono].map((f) => document.fonts.load(`40px "${f}"`));
    const giveUp = new Promise((r) => setTimeout(r, 2000)); // never hang on a font that fails to load
    Promise.race([Promise.all(fonts), giveUp]).finally(() => setReady(true));
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    const loops: Animated.CompositeAnimation[] = [];

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (stopped) return;
      if (reduce) {
        pop.setValue(1);
      } else {
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
        hops.forEach((v, i) => {
          const loop = Animated.loop(
            Animated.sequence([
              Animated.delay(i * 140),
              Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
              Animated.delay((BLOCKS.length - 1 - i) * 140 + 120),
            ]),
          );
          loops.push(loop);
          loop.start();
        });
      }
    });

    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => onDone());
    }, HOLD_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
      loops.forEach((l) => l.stop());
    };
  }, [ready, pop, fade, hops, onDone]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const rotate = pop.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '-2deg'] });

  return (
    <Animated.View style={[styles.root, { opacity: fade }]} accessibilityLabel="Loading Remainder" accessibilityRole="progressbar">
      <View style={StyleSheet.absoluteFill}>
        <DotGrid />
      </View>
      {ready ? <>
      <Txt v="label">Remainder / Loading</Txt>

      <View style={styles.title}>
        <Txt v="hero" numberOfLines={1}>Get it</Txt>
        <Animated.View style={[styles.mark, { opacity: pop, transform: [{ scale }, { rotate }] }]}>
          <Txt v="hero" color={C.paper} numberOfLines={1}>Done.</Txt>
        </Animated.View>
      </View>

      <View style={styles.blocks}>
        {BLOCKS.map((color, i) => (
          <Animated.View
            key={color}
            style={[
              styles.block,
              { backgroundColor: color, transform: [{ translateY: hops[i].interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }] },
            ]}
          />
        ))}
      </View>

      <Txt v="mono" color={C.mute}>{'> loading your tasks'}</Txt>
      </> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 10 },
  title: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  mark: { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 8 },
  blocks: { flexDirection: 'row', gap: 14, height: 40, alignItems: 'flex-end', marginTop: 8 },
  block: { width: 22, height: 22, borderRadius: 5, borderWidth: BW, borderColor: C.ink, boxShadow: SH.sm },
});
