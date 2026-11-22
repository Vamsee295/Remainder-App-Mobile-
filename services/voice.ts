import { NativeModules, Platform } from 'react-native';

const { AlarmModule } = NativeModules;

/** Voice typing uses Android's own speech recogniser (no extra library). */
export const canListen = Platform.OS === 'android' && Boolean(AlarmModule?.listen);

/** What the user said, or null if they cancelled. Throws if the phone has no speech recogniser. */
export async function listen(prompt: string): Promise<string | null> {
  return AlarmModule.listen(prompt);
}
