package com.cronosracing.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.ValueCallback;
import android.webkit.CookieManager;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.Button;
import android.widget.Toast;

public class MainActivity extends Activity {
    // Panel de campeonatos conectado con la misma base Firebase y web pública.
    private static final String HOME = "https://cronoscaja-sys.github.io/cronosracingec/sitio/campeonatos.html?app=1#admin";
    private static final String RANKINGS = "https://cronoscaja-sys.github.io/cronosracingec/sitio/campeonatos.html?app=1#resultados";
    private WebView web;
    private ProgressBar progress;
    private ValueCallback<Uri[]> pendingFile;
    private static final int PICK_FILE = 1122;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        web = findViewById(R.id.webview);
        progress = findViewById(R.id.progress);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(true);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager.getInstance().setAcceptCookie(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if ("https".equals(request.getUrl().getScheme()) &&
                    ("cronoscaja-sys.github.io".equalsIgnoreCase(request.getUrl().getHost()) ||
                     "github.com".equalsIgnoreCase(request.getUrl().getHost()) && false)) {
                    return false;
                }
                try { startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl())); }
                catch (Exception ex) { Toast.makeText(MainActivity.this, "No se pudo abrir el enlace", Toast.LENGTH_SHORT).show(); }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFile != null) pendingFile.onReceiveValue(null);
                pendingFile = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); }
                catch (Exception ex) { pendingFile.onReceiveValue(null); pendingFile = null; return false; }
                return true;
            }
        });
        findViewById(R.id.home).setOnClickListener(v -> openSection("proximos"));
        findViewById(R.id.rankings).setOnClickListener(v -> openSection("resultados"));
        findViewById(R.id.admin).setOnClickListener(v -> openSection("admin"));
        web.loadUrl(HOME);
    }
    private void openSection(String section) {
        // Cambia solo la seccion de la pagina y mantiene la sesion de Firebase.
        // El sitio usa hashchange para enfocar la seccion correcta.
        String url=web.getUrl();
        if(url != null && url.startsWith("https://cronoscaja-sys.github.io/cronosracingec/sitio/campeonatos.html")) {
            web.evaluateJavascript("window.location.hash='#" + section + "'; document.getElementById('" + section + "')?.scrollIntoView();", null);
        } else {
            web.loadUrl("https://cronoscaja-sys.github.io/cronosracingec/sitio/campeonatos.html?app=1#" + section);
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode,resultCode,data);
        if (requestCode == PICK_FILE && pendingFile != null) {
            pendingFile.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
            pendingFile = null;
        }
    }
    @Override public void onBackPressed() {
        if(web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if(pendingFile != null) pendingFile.onReceiveValue(null);
        web.destroy(); super.onDestroy();
    }
}
