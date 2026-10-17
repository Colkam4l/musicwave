# Setup Guide

Follow these steps to set up the development environment for the Rust YouTube Music client.

---

## 1. System Dependencies (Linux/Arch)
Since we are using `rodio` for audio playback, you need the ALSA development headers installed on your system.

Install them via `pacman`:
```bash
sudo pacman -S pkgconf alsa-lib
```

---

## 2. Authentication & Stream Authorization (Required to avoid 403 Forbidden)
YouTube restricts raw media playback streams to prevent automated bots. To play streams without encountering `HTTP 403 Forbidden` errors, you must authenticate the client using either browser cookies or a Proof of Origin (PO) Token.

### Option A: Using Browser Cookies (Recommended)
This allows the client to stream public tracks and access your private library, playlists, and likes.
1. Open your browser and go to [music.youtube.com](https://music.youtube.com).
2. Open developer tools (**F12**) and go to the **Network** tab.
3. Search/filter for any request to `/browse` or `/search` and inspect the **Request Headers**.
4. Copy the entire value of the `Cookie` header and the `User-Agent` header.
5. Create a file named `headers.json` in the root of the project (`/home/colkam/coding/ytmusicclient/headers.json`) with the following format:
   ```json
   {
     "User-Agent": "Mozilla/5.0 ...",
     "Cookie": "visitor-id=...; SID=...;"
   }
   ```

### Option B: Using a Proof of Origin (PO) Token (Guest Mode)
If you want to run the client in guest mode (public search/streams only) without signing in:
1. Open a browser in **Incognito/Private** mode (do not log into a Google Account).
2. Go to any video on [youtube.com](https://www.youtube.com).
3. Open developer tools (**F12**) and go to the **Network** tab.
4. Filter requests for `v1/player`.
5. Click on the request and look at the **Payload** tab (Request JSON body).
6. Under the JSON path `serviceIntegrityDimensions.poToken` (or similar integrity fields), copy the long token string.
7. Create a file named `po_token.txt` in the root of the project (`/home/colkam/coding/ytmusicclient/po_token.txt`) and paste the token as a single line.


---

## 3. Running the Client
*   To start in CLI player mode (Sprint 1):
    ```bash
    cargo run -- "your search query"
    ```

---

## 4. Tauri v2 Development Prerequisites (Sprint 0+)

From Sprint 0 onwards, the project uses Tauri v2. You need both Rust and Node.js tooling.

### System Dependencies (Arch Linux)

```bash
# Tauri system deps (WebKit, GTK, etc.)
sudo pacman -S webkit2gtk-4.1 base-devel curl wget openssl appmenu-gtk-module libappindicator-gtk3

# Node.js (LTS)
sudo pacman -S nodejs npm
```

### Install Frontend Dependencies

After cloning the repo (once Sprint 0 is complete):
```bash
npm install
```

### Start the Dev App

```bash
npm run tauri dev
```

---

## 5. Android Prerequisites (Sprint 5+)

Required to build the Android APK:

```bash
# Install Android SDK and NDK via Android Studio (recommended)
# Then set environment variables:
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls $ANDROID_HOME/ndk | head -1)"

# Add Rust cross-compilation targets
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# Install cargo-ndk helper
cargo install cargo-ndk
```

Start Android dev:
```bash
cargo tauri android dev
```

Build a debug APK:
```bash
cargo tauri android build --debug
```
