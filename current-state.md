# Current State — System Snapshot

## 1. Project Overview & Features
This is a native, Wayland-compatible YouTube Music client written in Rust.

### Active Features
*   **Sprint 1 Complete:** Project structure initialization, documentation setup, search resolution, YouTube signature cipher bypass, and CLI audio streaming/playback engine.
*   **Sprint 2 In-Progress:** Preparing MPRIS D-Bus Integration.

### Future Features
*   **Sprint 3:** Wayland GUI (Slint).
*   **Sprint 4:** iNiR Dynamic Theming.

---

## 2. Directory Layout & File Structure
```
ytmusicclient/
├── CLAUDE.md                   # Operating manual and styling guides
├── current-state.md            # Live system snapshot (this file)
├── decisions.md                # Architectural Decision Records (ADRs)
├── SETUP.md                    # Environment and authentication setup guide
├── Cargo.toml                  # Cargo dependencies configuration
└── src/
    └── main.rs                 # Project entry point and CLI player
```

---

## 3. Active External Dependencies & Services
*   **tokio:** Async runtime.
*   **ytmapi-rs:** Rust wrapper for the unofficial YouTube Music API.
*   **youtui-vendored-rusty_ytdl:** YouTube signature cipher and format resolver.
*   **stream-download:** Remote media streaming/caching adapter.
*   **rodio:** Audio output and decoding engine.

---

## 4. Endpoints & Integrations
*   **YouTubei API (Unofficial):** Search query and watch playlist metadata resolution.
*   **Wayland Protocol:** Native application windowing and rendering.
*   **D-Bus MPRIS:** Media player control interface (Sprint 2).
*   **Quickshell colors.json:** dynamic theme file at `~/.local/state/quickshell/user/generated/colors.json` (Sprint 4).
