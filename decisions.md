# Architectural Decisions (ADRs)

This document tracks technical decisions made during the design and implementation of the YouTube Music client.

---

## ADR 1: Selection of Slint as GUI Framework

### Context
We need a GUI framework that meets the following constraints:
1. Native compilation to avoid Electron/node memory footprint.
2. Full Wayland compatibility to run directly under Niri without XWayland.
3. Multiplatform compatibility (Linux, Windows, macOS).
4. Ease of styling to adapt dynamically to iNiR's Material You theme colors.

### Decision
We select **Slint** as our GUI framework.

### Consequences
*   **Pros:**
    *   Extremely lightweight (minimal binary size and RAM usage).
    *   Decoupled layout: UI is designed in a custom `.slint` markup syntax which compiles directly into Rust at build-time.
    *   First-class Wayland support out-of-the-box via the winit backend.
*   **Cons:**
    *   The `.slint` syntax is a separate markup language that needs to be learned.
    *   Dynamic runtime changes of styles require setting properties from Rust, rather than standard hot-reloading CSS files directly at runtime (though this is easily worked around using data binding).

---

## ADR 2: Selection of Rodio, Stream-Download, and Rusty_ytdl for Audio Playback

### Context
YouTube Music only provides streaming video/audio formats from Google's servers. To play the audio, we must:
1. Fetch metadata and get a Video ID (via `ytmusicapi`).
2. Resolve a direct HTTP stream URL for the audio stream (via a extractor like `rusty_ytdl`).
3. Stream/buffer the remote media without keeping the entire file in RAM or downloading it completely beforehand.
4. Output the decoded audio to the system speakers.

### Decision
We select the combination of:
*   **`rusty_ytdl`** to parse YouTube stream URLs.
*   **`stream-download`** to handle HTTP range requests, caching, and buffering of the stream.
*   **`rodio`** to decode and output audio to the system soundcard.

### Consequences
*   **Pros:**
    *   Pure Rust solution, eliminating native C-dependencies like `mpv` or `gstreamer` which can complicate cross-platform compilation (specifically on Windows/macOS).
    *   No local file download is needed before playback starts; `stream-download` handles caching chunks to disk/memory dynamically.
*   **Cons:**
    *   YouTube frequently updates its cipher/signature systems, meaning `rusty_ytdl` might break and require dependency updates.

---

## ADR 3: Pivot from Slint to Tauri v2 + React as the GUI Framework

### Context

ADR 1 selected Slint as the GUI framework. After the project's goals evolved to include:
1. A visual interface resembling a modern streaming app (search results with thumbnails, a persistent player bar, album art).
2. A future Android port.
3. A design workflow where the UI can be iterated quickly using familiar web tooling.

Slint's `.slint` markup language and its limited dynamic styling support made these goals significantly harder to achieve. Web technologies (HTML/CSS/React) are the dominant ecosystem for music player UIs specifically because they handle rich media cards, responsive layouts, and animations with mature tooling.

### Decision

Replace Slint with **Tauri v2 + React 18 + TypeScript + Vite**:
*   **Tauri v2** acts as the native desktop shell, providing the window, system tray, OS file system access, and the IPC bridge between Rust and the frontend.
*   **React 18 + TypeScript** is the frontend framework.
*   **Vite** is the frontend bundler (fast HMR for rapid UI iteration).
*   The existing Rust audio engine (`rodio`, `stream-download`, `rusty_ytdl`) is **preserved entirely** — Tauri wraps it, not replaces it.

### Consequences

*   **Pros:**
    *   Rich, modern UI is achievable with CSS, Framer Motion, and React ecosystem libraries.
    *   The same Tauri project supports **Android and iOS** as build targets (via `cargo tauri android init`) — the Rust backend carries over with zero changes.
    *   Faster iteration: `npm run tauri dev` with Vite's HMR means UI changes appear instantly without recompiling Rust.
    *   Auth credentials can be stored and edited through a Settings UI page (Sprint 4) — no more manual `headers.json` file editing.
*   **Cons:**
    *   Adds Node.js and npm to the development prerequisites.
    *   Tauri bundles a WebView (WebKit on Linux/macOS, WebView2 on Windows) — slightly larger binary than a pure Slint binary.
    *   The `.slint` syntax investment from ADR 1 is discarded.

### Migration Notes

*   The existing `src/main.rs` CLI engine is moved to `src-tauri/src/` and refactored into modules (`audio.rs`, `search.rs`, `stream.rs`, `commands.rs`) in Sprint 0.
*   All Rust dependencies in `Cargo.toml` are preserved. Only `tauri` and platform-specific deps are added.
