import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Task } from '@/types';
import { StorageService } from './storage-service';

export interface BackupData {
    tasks: Task[];
    exportDate: string;
    version: string;
}

export class DataService {
    private static readonly VERSION = '1.0.0';

    /**
     * Export all tasks to a JSON file
     */
    static async exportData(): Promise<string | null> {
        try {
            const tasks = await StorageService.loadTasks();

            const backupData: BackupData = {
                tasks,
                exportDate: new Date().toISOString(),
                version: this.VERSION,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const fileName = `remainder-backup-${this.formatDateForFilename()}.json`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            return fileUri;
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Share the exported file
     */
    static async shareBackup(): Promise<boolean> {
        try {
            const fileUri = await this.exportData();
            if (!fileUri) {
                return false;
            }

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                console.error('Sharing is not available on this device');
                return false;
            }

            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Share Reminder Backup',
            });

            return true;
        } catch (error) {
            console.error('Error sharing backup:', error);
            return false;
        }
    }

    /**
     * Import data from backup file
     */
    static async importData(fileUri: string): Promise<boolean> {
        try {
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const backupData: BackupData = JSON.parse(fileContent);

            // Validate backup data
            if (!backupData.tasks || !Array.isArray(backupData.tasks)) {
                throw new Error('Invalid backup file format');
            }

            // Save all tasks
            for (const task of backupData.tasks) {
                await StorageService.addTask(task);
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all tasks
     */
    static async clearAllData(): Promise<boolean> {
        try {
            const tasks = await StorageService.loadTasks();

            // Delete all tasks one by one
            for (const task of tasks) {
                await StorageService.deleteTask(task.id);
            }

            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Export single task as text
     */
    static formatTaskAsText(task: Task): string {
        const lines: string[] = [];

        lines.push(`📋 ${task.title}`);

        if (task.description) {
            lines.push(`\n📝 ${task.description}`);
        }

        const date = new Date(task.dateTime);
        lines.push(`\n📅 ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`);

        if (task.category) {
            lines.push(`\n🏷️ Category: ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}`);
        }

        if (task.priority) {
            lines.push(`\n⚡ Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`);
        }

        if (task.recurrence && task.recurrence !== 'none') {
            lines.push(`\n🔄 Recurrence: ${task.recurrence.charAt(0).toUpperCase() + task.recurrence.slice(1)}`);
        }

        if (task.subTasks && task.subTasks.length > 0) {
            lines.push('\n\n✅ Sub-tasks:');
            task.subTasks.forEach((subtask, index) => {
                const checkbox = subtask.completed ? '[✓]' : '[ ]';
                lines.push(`${checkbox} ${subtask.text}`);
            });
        }

        lines.push(`\n\n${task.completed ? '✔️ Completed' : '⏳ Pending'}`);

        return lines.join('\n');
    }

    /**
     * Share single task as text
     */
    static async shareTask(task: Task): Promise<boolean> {
        try {
            const taskText = this.formatTaskAsText(task);
            const fileName = `task-${task.id}.txt`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, taskText, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                return false;
            }

            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Share Task',
            });

            return true;
        } catch (error) {
            console.error('Error sharing task:', error);
            return false;
        }
    }

    /**
     * Format date for filename
     */
    private static formatDateForFilename(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}-${hours}${minutes}`;
    }
}
