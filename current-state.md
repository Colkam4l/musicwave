# Current State — System Snapshot

> **Sprint planning:** [`sprints/README.md`](./sprints/README.md) | **Operating manual:** [`CLAUDE.md`](./CLAUDE.md)

---

## 1. Project Overview & Status

MusicWave is a native, multiplatform YouTube Music client. The project has pivoted from a Slint GUI to a **Tauri v2 + React + TypeScript** stack (see ADR 3 in [`decisions.md`](./decisions.md)).

### Completed Work (Pre-Sprint 0)
*   **CLI Audio Engine:** Project structure, documentation, YouTube Music search, YouTube signature cipher bypass, HTTP stream buffering, and CLI audio playback are all functional in `src/main.rs`.

### Active Sprint
*   **Sprint 0 — Not Started:** Tauri project scaffolding and migration of the CLI engine into a Tauri app.

### Planned Sprints
| Sprint | Name | Status |
|---|---|---|
| [0](./sprints/SPRINT-0.md) | Tauri Project Scaffolding | ⏳ Not Started |
| [1](./sprints/SPRINT-1.md) | Core Search UI | ⏳ Not Started |
| [2](./sprints/SPRINT-2.md) | Audio Playback & Player Bar | ⏳ Not Started |
| [3](./sprints/SPRINT-3.md) | Queue, Library & Navigation | ⏳ Not Started |
| [4](./sprints/SPRINT-4.md) | Polish, Settings & Auth UX | ⏳ Not Started |
| [5](./sprints/SPRINT-5.md) | Android Port (Tauri Mobile) | ⏳ Not Started |

---

## 2. Current Directory Layout

```
ytmusicclient/
├── CLAUDE.md                   # Operating manual and code standards
├── current-state.md            # Live system snapshot (this file)
├── decisions.md                # Architectural Decision Records (ADRs)
├── SETUP.md                    # Environment and authentication setup guide
├── Cargo.toml                  # Legacy CLI Cargo manifest (to be replaced by workspace in Sprint 0)
├── src/
│   └── main.rs                 # Working CLI audio engine (Sprint 0 migrates this to src-tauri/)
└── sprints/
    ├── README.md               # Sprint index and conventions
    ├── SPRINT-0.md             # Tauri scaffolding plan
    ├── SPRINT-1.md             # Search UI plan
    ├── SPRINT-2.md             # Player bar plan
    ├── SPRINT-3.md             # Queue and library plan
    ├── SPRINT-4.md             # Polish and settings plan
    └── SPRINT-5.md             # Android port plan
```

**Target structure after Sprint 0** is documented in [`sprints/SPRINT-0.md`](./sprints/SPRINT-0.md#21-new-directory-structure-target-state-after-this-sprint).

---

## 3. Active External Dependencies & Services

### Rust Backend (current)
*   **tokio:** Async runtime (multi-threaded).
*   **ytmapi-rs:** Rust wrapper for the unofficial YouTube Music API — search and metadata.
*   **youtui-vendored-rusty_ytdl:** YouTube signature cipher and audio format resolver.
*   **stream-download:** HTTP range request streaming and local cache buffering.
*   **rodio:** Audio decoding and output to system soundcard.
*   **reqwest:** HTTP client (with JSON support) for custom authenticated requests.
*   **serde / serde_json:** Serialization for API responses and config files.

### Frontend (added in Sprint 0)
*   **Tauri v2:** Desktop app shell and IPC bridge.
*   **React 18 + TypeScript + Vite:** Frontend framework and bundler.
*   **Zustand:** Lightweight global state management.
*   **Framer Motion:** Animations (added Sprint 4).
*   **@tauri-apps/api:** Tauri IPC (`invoke`, `listen`, `path`, `os`).

---

## 4. Endpoints & Integrations

*   **YouTubei API (Unofficial):** Search query and song metadata resolution (unauthenticated).
*   **YouTube Stream URLs:** Direct audio stream extraction via `rusty_ytdl` (requires auth for non-public streams).
*   **D-Bus MPRIS:** System media key integration — Sprint 4, Linux only.
*   **Android AAudio:** Audio output on Android — Sprint 5, via CPAL backend in rodio.

---

## 5. Authentication

Two auth methods are supported (see [`SETUP.md`](./SETUP.md) for setup instructions):

| Method | File | Use Case |
|---|---|---|
| Browser cookies | `headers.json` (legacy) / `settings.json` (Sprint 4+) | Authenticated playback, private library |
| PO Token | `po_token.txt` (legacy) / `settings.json` (Sprint 4+) | Guest mode public streams |

From Sprint 4 onwards, auth is configured through the in-app Settings page — no manual file editing required.
