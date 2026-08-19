package com.kingfish.wordcoach;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

public class MainActivity extends Activity {
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
                getSharedPreferences("wordcoach", MODE_PRIVATE)
                        .edit().putString("progress", json).apply();
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public String loadProgress() {
            try {
                return getSharedPreferences("wordcoach", MODE_PRIVATE)
                        .getString("progress", null);
            } catch (Exception e) {
                return null;
            }
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
