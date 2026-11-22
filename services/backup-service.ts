import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { Backup, backupFileName, makeBackup, parseBackup } from './backup-format';
import { StorageService } from './storage-service';

/**
 * Writes everything to a JSON file and opens the share sheet,
 * so it can be saved to Google Drive, Files, email or a chat with yourself.
 */
export async function exportBackup(): Promise<void> {
  const [tasks, todos, suggestions] = await Promise.all([
    StorageService.loadTasks(),
    StorageService.loadTodos(),
    StorageService.loadTaskSuggestions(),
  ]);
  const json = JSON.stringify(makeBackup(tasks as never, todos as never, suggestions as never), null, 2);
  const name = backupFileName();

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your Remainder backup', UTI: 'public.json' });
}

/** Lets the user pick a backup file and checks it. Returns null if they cancelled. Throws with a readable message. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return parseBackup(text);
}
