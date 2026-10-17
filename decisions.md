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
