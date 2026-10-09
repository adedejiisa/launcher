# Android Desktop Launcher — Full Updated Project

React + Vite + Capacitor Android project for a Windows-inspired desktop interface intended for landscape use.

## Build an APK using GitHub Actions from your phone

1. Download and extract this ZIP.
2. Open your GitHub repository.
3. Upload the **contents** of the extracted project folder to the repository root. Do not upload only the ZIP file.
4. The repository root should show `package.json`, `index.html`, `src/`, and `.github/`.
5. Commit the files to `main`.
6. Open **Actions** and select **Build Android Desktop Launcher APK**.
7. Tap **Run workflow** if it has not started automatically.
8. When the run succeeds, open it and download `Android-Desktop-Launcher-debug`.
9. Extract the artifact ZIP and install `app-debug.apk`.

## What was corrected

The previous workflow failed during Android SDK setup with `Failed to find package 'tools'`. The legacy Android SDK `tools` package has been retired. This workflow uses `android-actions/setup-android@v4`, explicitly requests `platform-tools`, and installs Android platform 35 and build-tools 35.0.0. Official action documentation: https://github.com/android-actions/setup-android

The workflow then installs Node dependencies, builds React, creates and syncs the Capacitor Android project, configures landscape orientation and Android Home launcher intent support, adds a native bridge for device battery/volume status, system settings, and Android “Open with”, builds with Gradle, and uploads the APK.

## Local web development

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```

## Android capability limits

This is a desktop-style launcher interface inside an Android app, not a replacement for Android itself. It cannot replace Android's secure lock screen or control power-off/restart. After installation, choose **Android Launcher** as the Home app when Android asks (or select it under Settings → Apps → Default apps → Home app). The app starts in landscape and uses immersive full-screen mode; swipe from an edge to reveal Android system bars temporarily. Some manufacturers impose extra restrictions.

The current UI includes a file-explorer interface, browser-style window, and media/document previews supported by Android WebView. The Android build includes a native “Open with” chooser for files selected in File Explorer, actual device battery percentage, actual media-volume control, and shortcuts into Android Wi-Fi/sound/battery settings. The brightness slider adjusts the launcher display appearance only; Android does not let an ordinary app freely change device-wide brightness without extra permission. Full filesystem indexing and full Chrome capabilities are outside a web-based launcher; embedded websites can block WebView display. An embedded browser is not the same as the Chrome app.

## Build guarantee

This ZIP corrects the exact SDK setup failure visible in the previous screenshot. A 100% successful build cannot honestly be promised before the workflow runs against your actual GitHub repository, because Gradle compatibility, network/dependency availability, and repository upload layout must be tested remotely. If a later step fails, that step's log will show the next issue.
