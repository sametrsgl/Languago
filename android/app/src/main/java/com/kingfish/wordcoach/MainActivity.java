package com.kingfish.wordcoach;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Calendar;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String CHANNEL_ID = "reminders";
    private static final String PREFS = "wordcoach";
    private static final int ALARM_REQUEST = 100;
    private static final int NOTIFY_ID = 1;

    private WebView webView;
    private TextToSpeech tts;

    // Bridge exposed to JS. This app loads ONLY local bundled assets
    // (file:///android_asset) — no remote URLs, no user-supplied content — so the
    // interface below is not an XSS surface (the lint flag is a false positive here).
    private class Bridge {
        @JavascriptInterface
        public void speak(String text) {
            speakWord(text);
        }

        @JavascriptInterface
        public void exit() {
            finish();
        }

        // Reliable progress persistence. localStorage on file:// origins is not
        // guaranteed to survive app restarts on all WebView builds, so we mirror
        // the SRS progress into SharedPreferences.
        @JavascriptInterface
        public void saveProgress(String json) {
            try {
                getSharedPreferences(PREFS, MODE_PRIVATE)
                        .edit().putString("progress", json).apply();
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public String loadProgress() {
            try {
                return getSharedPreferences(PREFS, MODE_PRIVATE)
                        .getString("progress", null);
            } catch (Exception e) {
                return null;
            }
        }

        // ---- notifications ----
        // Schedule/cancel the daily reminder. hour/minute = 24h local time.
        // title/body are built by the JS (body reflects today's incomplete tasks).
        @JavascriptInterface
        public void setReminder(boolean enabled, int hour, int minute, String title, String body) {
            scheduleReminder(enabled, hour, minute, title, body);
        }

        // Ask for POST_NOTIFICATIONS on Android 13+ when the user enables reminders.
        @JavascriptInterface
        public void requestNotifications() {
            requestNotificationPermission();
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage for progress / spaced repetition
        s.setAllowFileAccess(true);
        s.setLoadsImagesAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // The app loads only local assets; open any mailto:/external http(s)
                // links (e.g. the support email) in the system's mail/browser app.
                if (url != null && (url.startsWith("mailto:") || url.startsWith("http://") || url.startsWith("https://"))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) {
                    }
                    return true;
                }
                return false;
            }
        });
        webView.setBackgroundColor(0xFFF7F5F0); // match app background -> no white flash
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);

        initTts();
        ensureNotificationChannel();
    }

    private void initTts() {
        try {
            tts = new TextToSpeech(this, status -> {
                if (status == TextToSpeech.SUCCESS) {
                    int r = tts.setLanguage(Locale.US); // English pronunciation
                    if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(Locale.UK);
                    }
                }
            });
        } catch (Exception ignored) {
            tts = null; // TTS unavailable on this device — app still works
        }
    }

    private void speakWord(String text) {
        if (tts == null || text == null || text.isEmpty()) return;
        try {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "wordcoach_" + text.hashCode());
        } catch (Exception ignored) {
        }
    }

    // ---- notifications ----
    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_ID, "Hatırlatmalar", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("Günlük çalışma ve görev hatırlatmaları");
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.createNotificationChannel(ch);
            } catch (Exception ignored) {
            }
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(
                            new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 42);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private void scheduleReminder(boolean enabled, int hour, int minute, String title, String body) {
        SharedPreferences sp = getSharedPreferences(PREFS, MODE_PRIVATE);
        sp.edit()
                .putBoolean("reminder_enabled", enabled)
                .putInt("reminder_hour", hour)
                .putInt("reminder_minute", minute)
                .putString("reminder_title", (title == null || title.isEmpty()) ? "Lingo Branch" : title)
                .putString("reminder_body", (body == null || body.isEmpty()) ? "Dil öğrenme zamanı! 🌿" : body)
                .apply();

        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, ReminderReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(
                this, ALARM_REQUEST, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (am != null) am.cancel(pi);
        if (!enabled || am == null) return;

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        try {
            am.setInexactRepeating(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(),
                    AlarmManager.INTERVAL_DAY, pi);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onBackPressed() {
        // Let the SPA navigate back; JS calls AndroidBridge.exit() when at the root.
        if (webView != null) {
            webView.evaluateJavascript("window.__handleBack && window.__handleBack()", null);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            try {
                tts.shutdown();
            } catch (Exception ignored) {
            }
            tts = null;
        }
        super.onDestroy();
    }
}
