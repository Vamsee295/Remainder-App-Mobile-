# How to Add Your Custom Alarm Sounds

## Step 1: Prepare Your Audio Files

1. Choose your favorite songs or alarm sounds
2. **Trim them to 30 seconds or less** (use any audio editor)
3. **Convert to MP3 format** (recommended)
4. **Keep file size small** (< 1MB per file for best performance)

## Step 2: Add Files to Your Project

1. Navigate to your project folder:
   ```
   x:\Project-Buildings\remainder-app\remainder-app\assets\sounds\
   ```

2. Place your audio files in the `sounds` folder with these exact names:
   - `custom_alarm_1.mp3` (Your first custom sound)
   - `custom_alarm_2.mp3` (Your second custom sound)
   - `custom_alarm_3.mp3` (Your third custom sound)
   - `custom_alarm_4.mp3` (Your fourth custom sound)
   - `custom_alarm_5.mp3` (Your fifth custom sound)

## Step 3: Restart Expo

After adding your files:
1. Stop the Expo server (Ctrl+C in terminal)
2. Run `npx expo start` again
3. The app will bundle your custom sounds

## File Naming Rules

✅ **DO:**
- Use lowercase letters
- Use underscores instead of spaces
- Keep filenames simple
- Use `.mp3` extension

❌ **DON'T:**
- Use spaces in filenames
- Use special characters
- Use very long filenames
- Use uppercase letters

## Example Audio Sources

If you don't have audio files yet, you can find royalty-free sounds at:
- **Freesound.org** - Free sound effects
- **Zapsplat.com** - Free alarm sounds
- **YouTube Audio Library** - Royalty-free music

## Supported Formats

- ✅ MP3 (Recommended)
- ✅ WAV
- ✅ AAC
- ⚠️ M4A (May have issues on some devices)

## File Size Recommendations

- **Optimal**: 100-500 KB
- **Maximum**: 1 MB
- **Duration**: 10-30 seconds

## Current Configuration

The app comes with 5 default alarm tones:
1. Classic Alarm (Built-in)
2. Gentle Wake (Built-in)
3. Urgent Beep (Built-in)
4. Morning Chime (Built-in)
5. Digital Alert (Built-in)

**To replace with your own sounds**, simply add your MP3 files as shown in Step 2!
