package com.vamsee05.remainderapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Full-screen "alarm is ringing" screen. Shows over the lock screen and wakes the display.
 * Styled like the rest of the app: night background, paper text, burnt-orange primary button.
 */
public class AlarmActivity extends AppCompatActivity {
    private static final int NIGHT = 0xFF151311;
    private static final int PAPER = 0xFFF5EFE6;
    private static final int CARD = 0xFFFBF8F2;
    private static final int INK = 0xFF191614;
    private static final int ACCENT = 0xFFC8603A;
    private static final int MINT = 0xFF7CC9B2;
    private static final int MUTED = 0xFFB9AEA0;

    private TextView titleView;
    private TextView descriptionView;

    /** Close this screen when the ringing stops for any reason (notification button, timeout). */
    private final BroadcastReceiver stoppedReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(NIGHT);
        getWindow().setNavigationBarColor(NIGHT);

        setContentView(buildLayout());
        showAlarm(getIntent());

        ContextCompat.registerReceiver(this, stoppedReceiver, new IntentFilter(AlarmService.ACTION_STOPPED),
            ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        showAlarm(intent);
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(stoppedReceiver);
        super.onDestroy();
    }

    private void showAlarm(Intent intent) {
        String title = intent.getStringExtra("title");
        String description = intent.getStringExtra("description");
        titleView.setText(title == null || title.isEmpty() ? "REMINDER" : title.toUpperCase(Locale.getDefault()));
        descriptionView.setText(description == null ? "" : description);
        descriptionView.setVisibility(description == null || description.isEmpty() ? View.GONE : View.VISIBLE);
    }

    private View buildLayout() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(NIGHT);
        root.setGravity(Gravity.CENTER_VERTICAL);
        root.setPadding(dp(28), dp(48), dp(28), dp(48));

        root.addView(text("REMAINDER / ALARM", 12, MINT, Typeface.MONOSPACE, 0.2f));

        TextView time = text(new SimpleDateFormat("h:mm a", Locale.getDefault()).format(new Date()), 76, PAPER,
            Typeface.create("sans-serif-condensed", Typeface.BOLD), -0.02f);
        root.addView(time, margins(12, 0));

        titleView = text("", 34, ACCENT, Typeface.create("sans-serif-condensed", Typeface.BOLD), 0.02f);
        root.addView(titleView, margins(4, 0));

        descriptionView = text("", 16, MUTED, Typeface.DEFAULT, 0f);
        root.addView(descriptionView, margins(10, 0));

        TextView dismiss = button("DISMISS", ACCENT, PAPER);
        dismiss.setOnClickListener(v -> sendToService(AlarmService.ACTION_DISMISS, 0));
        root.addView(dismiss, margins(44, 0));

        LinearLayout snoozeRow = new LinearLayout(this);
        snoozeRow.setOrientation(LinearLayout.HORIZONTAL);
        TextView snooze5 = button("SNOOZE 5", CARD, INK);
        snooze5.setOnClickListener(v -> sendToService(AlarmService.ACTION_SNOOZE, 5));
        TextView snooze10 = button("SNOOZE 10", CARD, INK);
        snooze10.setOnClickListener(v -> sendToService(AlarmService.ACTION_SNOOZE, 10));
        LinearLayout.LayoutParams left = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        left.rightMargin = dp(7);
        LinearLayout.LayoutParams right = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        right.leftMargin = dp(7);
        snoozeRow.addView(snooze5, left);
        snoozeRow.addView(snooze10, right);
        root.addView(snoozeRow, margins(14, 0));

        return root;
    }

    private void sendToService(String action, int minutes) {
        Intent intent = new Intent(this, AlarmService.class).setAction(action);
        intent.putExtra("minutes", minutes);
        try {
            startService(intent);
        } catch (IllegalStateException ignored) {
            // The alarm already stopped and the service is gone: nothing left to stop.
        }
        finish();
    }

    private TextView text(String value, int sizeSp, int color, Typeface typeface, float letterSpacing) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp);
        view.setTextColor(color);
        view.setTypeface(typeface);
        view.setLetterSpacing(letterSpacing);
        return view;
    }

    /** Portfolio-style button: flat fill, thick border, 12dp corners. */
    private TextView button(String label, int fill, int textColor) {
        TextView view = text(label, 20, textColor, Typeface.create("sans-serif-condensed", Typeface.BOLD), 0.06f);
        view.setGravity(Gravity.CENTER);
        view.setPadding(dp(16), dp(18), dp(16), dp(18));
        view.setMinHeight(dp(60));
        GradientDrawable background = new GradientDrawable();
        background.setColor(fill);
        background.setCornerRadius(dp(12));
        background.setStroke(dp(3), fill == ACCENT ? PAPER : INK);
        view.setBackground(background);
        view.setClickable(true);
        view.setFocusable(true);
        view.setContentDescription(label);
        return view;
    }

    private LinearLayout.LayoutParams margins(int topDp, int bottomDp) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(topDp);
        params.bottomMargin = dp(bottomDp);
        return params;
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics()));
    }

    @Override
    public void onBackPressed() {
        // Back does nothing: the alarm must be dismissed or snoozed.
    }
}
