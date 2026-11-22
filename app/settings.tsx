import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, FieldLabel, IconButton, Screen, ScreenHeader, SectionHeader, Txt } from '@/components/kit';
import { C } from '@/constants/theme';
import { Fix, useHealth } from '@/hooks/use-health';
import { useTasks } from '@/hooks/use-tasks';
import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/services/app-settings';
import { exportBackup, pickBackup } from '@/services/backup-service';
import { NotificationService } from '@/services/notification-service';
import { askCalendarPermission, canUseCalendar } from '@/services/phone-calendar';
import { StorageService } from '@/services/storage-service';
import { Task } from '@/types';

const LAST_BACKUP_KEY = '@remainder_last_backup';

const CHECKS: { key: Fix; title: string; why: string }[] = [
  { key: 'notifications', title: 'Notifications allowed', why: 'Without this you get no reminders at all.' },
  { key: 'exactAlarms', title: 'Alarms & reminders allowed', why: 'Lets reminders go off at the exact minute.' },
  { key: 'battery', title: 'Battery: unrestricted', why: 'Stops the phone from putting Remainder to sleep and skipping alarms.' },
  { key: 'fullScreen', title: 'Full-screen alarms allowed', why: 'Lets a ringing alarm show over the lock screen.' },
];

/** Phones known to kill background apps unless Autostart is on. */
const STRICT_MAKERS = ['xiaomi', 'redmi', 'poco', 'oppo', 'realme', 'vivo', 'iqoo', 'oneplus', 'huawei', 'honor', 'tecno', 'infinix'];

/** Yes/no question that also works on web, where Alert has no buttons. */
function confirm(title: string, message: string, ok: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

const say = (title: string, message: string) => (Platform.OS === 'web' ? window.alert(`${title}\n\n${message}`) : Alert.alert(title, message));

export default function SettingsScreen() {
  const { tasks, restoreTasks } = useTasks();
  const { health, problems, openFix, canCheck } = useHealth();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const [prefs, setPrefs] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(LAST_BACKUP_KEY).then(setLastBackup).catch(() => {});
    loadSettings().then(setPrefs);
  }, []);

  const update = (change: Partial<AppSettings>) => {
    const next = { ...prefs, ...change };
    setPrefs(next);
    saveSettings(next);
  };

  const backup = async () => {
    setBusy(true);
    try {
      await exportBackup();
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_BACKUP_KEY, now);
      setLastBackup(now);
    } catch (e) {
      say('Backup failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      const data = await pickBackup();
      if (!data) return;
      const when = new Date(data.exportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const ok = await confirm(
        'Replace everything?',
        `This backup from ${when} has ${data.tasks.length} tasks and ${data.todos.length} to-dos. It replaces the ${tasks.length} tasks on this phone.`,
        'Restore',
      );
      if (!ok) return;
      setBusy(true);
      await restoreTasks(data.tasks as unknown as Task[]);
      await StorageService.saveTodos(data.todos as never);
      await StorageService.saveTaskSuggestions(data.suggestions as never);
      say('Restored', `${data.tasks.length} tasks and ${data.todos.length} to-dos are back, with their reminders set again.`);
    } catch (e) {
      say("Couldn't restore", e instanceof Error ? e.message : 'Try another file.');
    } finally {
      setBusy(false);
    }
  };

  const strictPhone = health && STRICT_MAKERS.some((m) => health.maker.includes(m));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.back}>
          <IconButton icon="arrow-back-sharp" label="Back" onPress={() => router.back()} />
        </View>
        <ScreenHeader eyebrow="Remainder / Settings" hand="so nothing gets missed" title="Your" mark="Setup." />

        <SectionHeader n={1} eyebrow="Reliability" title="Will it ring?" />
        {!canCheck ? (
          <Txt v="mono" color={C.mute}>{'> These checks run on the Android app.'}</Txt>
        ) : !health ? (
          <Txt v="mono" color={C.mute}>{'> Checking…'}</Txt>
        ) : (
          <>
            <Txt v="mono" color={problems.length ? C.accentD : C.teal} style={styles.summary}>
              {problems.length ? `> ${problems.length} setting${problems.length > 1 ? 's' : ''} can stop reminders. Fix below.` : '> All set. Reminders can ring on time.'}
            </Txt>
            {CHECKS.map((c) => {
              const ok = health[c.key];
              return (
                <Card key={c.key} style={styles.check}>
                  <View style={[styles.dot, { backgroundColor: ok ? C.teal : C.accent }]}>
                    <Txt v="cond" color={C.paper}>{ok ? '✓' : '!'}</Txt>
                  </View>
                  <View style={styles.flex}>
                    <Txt v="cond">{c.title}</Txt>
                    <Txt style={styles.why}>{c.why}</Txt>
                  </View>
                  {ok ? null : <Button label="Fix" style={styles.fix} onPress={() => openFix(c.key)} />}
                </Card>
              );
            })}
            {strictPhone ? (
              <Card style={styles.tip}>
                <Txt v="cond">On this phone, also turn on Autostart</Txt>
                <Txt style={styles.why}>
                  Settings → Apps → Remainder → Autostart (or &quot;Allow background activity&quot;). Some phones also need Remainder locked in the
                  recent-apps screen.
                </Txt>
              </Card>
            ) : null}
            <Button
              label={testing ? 'Rings in 10 seconds…' : 'Ring a test alarm'}
              kind="secondary"
              style={styles.test}
              disabled={testing}
              onPress={() => {
                setTesting(true);
                NotificationService.ringTestAlarm(10)
                  .catch(() => say('Test alarm failed', 'Allow "Alarms & reminders" above, then try again.'))
                  .finally(() => setTimeout(() => setTesting(false), 10000));
              }}
            />
            <Txt v="mono" style={styles.hint}>{'> Lock the phone after tapping. It should ring full screen.'}</Txt>
          </>
        )}

        <SectionHeader n={2} eyebrow="Defaults" title="Reminders" />
        <FieldLabel>New reminders</FieldLabel>
        <View style={styles.chips}>
          <Chip label="Notification" active={!prefs.defaultRing} color={C.ink} onPress={() => update({ defaultRing: false })} />
          <Chip label="Ring alarm" active={prefs.defaultRing} onPress={() => update({ defaultRing: true })} />
        </View>
        <FieldLabel>Snooze for</FieldLabel>
        <View style={styles.chips}>
          {[5, 10, 15, 30].map((m) => (
            <Chip key={m} label={`${m} min`} active={prefs.snooze === m} color={C.teal} onPress={() => update({ snooze: m })} />
          ))}
        </View>
        <FieldLabel>If a notification is ignored</FieldLabel>
        <View style={styles.chips}>
          {[0, 1, 2, 3].map((n) => (
            <Chip key={n} label={n === 0 ? 'Once only' : `+${n} more`} active={prefs.followUps === n} color={C.teal} onPress={() => update({ followUps: n })} />
          ))}
        </View>
        <Txt v="mono" style={styles.hint}>{'> Follow-ups come 5 minutes apart until you tap Done or Snooze.'}</Txt>
        <FieldLabel>An alarm rings for</FieldLabel>
        <View style={styles.chips}>
          {[1, 2, 5, 10].map((m) => (
            <Chip key={m} label={`${m} min`} active={prefs.ringMinutes === m} color={C.teal} onPress={() => update({ ringMinutes: m })} />
          ))}
        </View>
        <Txt v="mono" style={styles.hint}>{'> Then it stops and leaves a "Missed alarm" note with Done / Snooze.'}</Txt>

        {canUseCalendar ? (
          <>
            <FieldLabel>Show my phone calendar in the Calendar tab</FieldLabel>
            <View style={styles.chips}>
              <Chip label="Off" active={!prefs.showCalendar} color={C.ink} onPress={() => update({ showCalendar: false })} />
              <Chip
                label="On"
                active={prefs.showCalendar}
                color={C.teal}
                onPress={async () => {
                  if (await askCalendarPermission()) update({ showCalendar: true });
                  else say('Calendar not allowed', 'Allow calendar access for Remainder in your phone settings to see your events.');
                }}
              />
            </View>
            <Txt v="mono" style={styles.hint}>{'> Read-only: your events show next to tasks, with a "Remind me" button. Google Calendar works if it syncs to this phone.'}</Txt>
          </>
        ) : null}

        <SectionHeader n={3} eyebrow="Your data" title="Backup" />
        <Txt style={styles.why}>
          Everything lives only on this phone. Save a backup file to Google Drive, Files or a chat with yourself, and restore it after
          reinstalling or on a new phone.
        </Txt>
        <Txt v="mono" color={C.mute} style={styles.summary}>
          {`> Last backup: ${lastBackup ? new Date(lastBackup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'never'}`}
        </Txt>
        <Button label="Save backup" arrow disabled={busy} onPress={backup} />
        <Button label="Restore from file" kind="secondary" disabled={busy} style={styles.restore} onPress={restore} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingRight: 26, paddingBottom: 60 },
  back: { alignItems: 'flex-start', marginBottom: 6 },
  flex: { flex: 1, gap: 2 },
  summary: { marginBottom: 12 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  why: { fontSize: 14, lineHeight: 20 },
  fix: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 16 },
  tip: { padding: 14, marginBottom: 12, gap: 4 },
  test: { marginTop: 4 },
  hint: { fontSize: 12, color: C.mute, marginTop: 8 },
  restore: { marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingRight: 4, paddingBottom: 4 },
});
