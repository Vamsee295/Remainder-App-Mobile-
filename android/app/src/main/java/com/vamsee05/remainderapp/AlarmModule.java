package com.vamsee05.remainderapp;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/** JS bridge: NativeModules.AlarmModule */
public class AlarmModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AlarmModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AlarmModule";
    }

    /**
     * @param repeatDaily ring again every day at the same time
     * @param until       timestamp after which a repeating alarm stops (0 = never stops)
     */
    @ReactMethod
    public void setAlarm(String alarmId, double timestamp, String soundUri, String title, String description,
                         boolean repeatDaily, double until, String mode, Promise promise) {
        try {
            boolean ok = AlarmScheduler.schedule(reactContext, alarmId, (long) timestamp, soundUri, title,
                description, repeatDaily, (long) until, mode, 0);
            if (ok) promise.resolve(alarmId);
            else promise.reject("PERMISSION_ERROR", "Exact alarms are not allowed for this app");
        } catch (Exception e) {
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }

    /** Done / Snooze taps made outside the app since the last call, as a JSON array string. Empties the queue. */
    @ReactMethod
    public void consumeEvents(Promise promise) {
        promise.resolve(AlarmActions.consume(reactContext));
    }

    @ReactMethod
    public void cancelAlarm(String alarmId, Promise promise) {
        try {
            AlarmScheduler.cancel(reactContext, alarmId);
            promise.resolve(alarmId);
        } catch (Exception e) {
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
}
