import { useCallback, useEffect, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';

/** Each flag true = fine. null = can't check here (web / iPhone / old build without the native module). */
export type Health = { notifications: boolean; exactAlarms: boolean; battery: boolean; fullScreen: boolean; maker: string };
export type Fix = 'notifications' | 'exactAlarms' | 'battery' | 'fullScreen';

const { AlarmModule } = NativeModules;
const canCheck = Platform.OS === 'android' && Boolean(AlarmModule?.getHealth);

/** Phone settings that can stop reminders. Re-checks when the app comes back (after visiting Settings). */
export function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);

  const refresh = useCallback(async () => {
    if (!canCheck) return;
    try {
      setHealth(await AlarmModule.getHealth());
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const problems = health ? (['notifications', 'exactAlarms', 'battery', 'fullScreen'] as Fix[]).filter((k) => !health[k]) : [];
  const openFix = (which: Fix) => AlarmModule?.openFix?.(which);

  return { health, problems, refresh, openFix, canCheck };
}
