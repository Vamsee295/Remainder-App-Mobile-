package com.vamsee05.remainderapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * Rings the alarm: loops the sound on the alarm volume and vibrates until the
 * user dismisses or snoozes it, or until the ring time from Settings passes.
 */
public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    public static final String ACTION_RING = "com.vamsee05.remainderapp.RING";
    public static final String ACTION_DISMISS = "com.vamsee05.remainderapp.DISMISS";
    public static final String ACTION_SNOOZE = "com.vamsee05.remainderapp.SNOOZE";
    public static final String ACTION_DONE = "com.vamsee05.remainderapp.DONE";
    /** Broadcast so the full-screen alarm closes when the ringing stops. */
    public static final String ACTION_STOPPED = "com.vamsee05.remainderapp.ALARM_STOPPED";

    private static final String CHANNEL_ID = "ALARM_RINGING";
    private static final String MISSED_CHANNEL_ID = "ALARM_MISSED";
    private static final int NOTIFICATION_ID = 1001;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeout = this::onTimeout;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private String alarmId;
    private String soundUri;
    private String title;
    private String description;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();

        if (ACTION_RING.equals(action)) {
            stopRinging(); // a second alarm replaces the one already ringing
            alarmId = intent.getStringExtra("alarmId");
            soundUri = intent.getStringExtra("soundUri");
            title = intent.getStringExtra("title");
            description = intent.getStringExtra("description");

            startForeground(NOTIFICATION_ID, buildRingingNotification());
            playSound();
            startVibration();
            handler.postDelayed(timeout, AppSettings.ringMs(this));
        } else if (ACTION_SNOOZE.equals(action) && alarmId != null) {
            AlarmActions.snooze(this, alarmId, intent.getIntExtra("minutes", AppSettings.snoozeMinutes(this)), soundUri, title, description, "ring");
            finishAlarm();
        } else if (ACTION_DONE.equals(action) && alarmId != null) {
            AlarmActions.done(this, alarmId); // the app ticks the task off next time it opens
            finishAlarm();
        } else {
            // Dismiss, or a button was pressed after the alarm had already stopped.
            finishAlarm();
        }
        return START_NOT_STICKY;
    }

    private void playSound() {
        Uri custom = soundUri != null && soundUri.startsWith("content://") ? Uri.parse(soundUri) : null;
        Uri[] candidates = {
            custom,
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
        };
        // The imported file can become unreadable (moved, permission lost): fall back to the next sound.
        for (Uri uri : candidates) {
            if (uri == null) continue;
            MediaPlayer player = new MediaPlayer();
            try {
                player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
                player.setDataSource(this, uri);
                player.setLooping(true);
                player.prepare();
                player.start();
                mediaPlayer = player;
                return;
            } catch (Exception e) {
                Log.w(TAG, "Could not play " + uri, e);
                player.release();
            }
        }
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = {0, 700, 500};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = repeat from the start
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void stopRinging() {
        handler.removeCallbacks(timeout);
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (IllegalStateException ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
    }

    private void finishAlarm() {
        stopRinging();
        sendBroadcast(new Intent(ACTION_STOPPED).setPackage(getPackageName()));
        stopForeground(true);
        stopSelf();
    }

    /** Nobody reacted: stop the noise and leave a quiet note behind. */
    private void onTimeout() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null && alarmId != null) {
            manager.notify(alarmId.hashCode(), AlarmActions.withButtons(this, new NotificationCompat.Builder(this, MISSED_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Missed alarm: " + (title == null ? "Reminder" : title))
                .setContentText(description)
                .setContentIntent(openAppIntent())
                .setAutoCancel(true), alarmId, title, description, "ring")
                .build());
        }
        finishAlarm();
    }

    private Notification buildRingingNotification() {
        Intent fullScreen = new Intent(this, AlarmActivity.class);
        fullScreen.putExtra("title", title);
        fullScreen.putExtra("description", description);
        fullScreen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullScreenIntent = PendingIntent.getActivity(this, 1, fullScreen,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title == null ? "Reminder" : title)
            .setContentText(description == null || description.isEmpty() ? "Your alarm is ringing" : description)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(fullScreenIntent)
            .setFullScreenIntent(fullScreenIntent, true)
            .addAction(0, "Done", serviceIntent(ACTION_DONE, 5))
            .addAction(0, "Snooze " + AppSettings.snoozeMinutes(this) + " min", serviceIntent(ACTION_SNOOZE, 2))
            .addAction(0, "Dismiss", serviceIntent(ACTION_DISMISS, 3))
            .build();
    }

    private PendingIntent serviceIntent(String action, int requestCode) {
        Intent intent = new Intent(this, AlarmService.class).setAction(action);
        return PendingIntent.getService(this, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent openAppIntent() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        return PendingIntent.getActivity(this, 4, open == null ? new Intent() : open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        // Silent channel: this service plays the sound itself so it can loop on the alarm volume.
        NotificationChannel ringing = new NotificationChannel(CHANNEL_ID, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH);
        ringing.setDescription("Shown while an alarm is ringing");
        ringing.setSound(null, null);
        ringing.enableVibration(false);
        ringing.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(ringing);

        NotificationChannel missed = new NotificationChannel(MISSED_CHANNEL_ID, "Missed alarms", NotificationManager.IMPORTANCE_DEFAULT);
        missed.setDescription("Alarms that rang with no response");
        manager.createNotificationChannel(missed);
    }

    @Override
    public void onDestroy() {
        stopRinging();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
