# CLAUDE.md — Operating Manual

Operating rules, commands, and code styling standards for the Rust YouTube Music client workspace.

## 1. Project Definition
A native, Wayland-compatible, multiplatform desktop client for YouTube Music written in Rust. It utilizes the unofficial YouTubei API for metadata, `rusty_ytdl` and `stream-download` for audio stream extraction/buffering, and `rodio` for playback. It integrates with Wayland (Niri) natively, D-Bus (MPRIS) for system integration, and the iNiR shell for dynamic wallpaper-based theming.

---

## 2. Core Execution Commands

### Build & Run
*   **Compile project:** `cargo build`
*   **Compile production release:** `cargo build --release`
*   **Run development server/app:** `cargo run`
*   **Run with custom log level:** `RUST_LOG=info cargo run`

### Quality Assurance
*   **Run test suite:** `cargo test`
*   **Check code formatting:** `cargo fmt --check`
*   **Apply code formatting:** `cargo fmt`
*   **Run linter:** `cargo clippy -- -D warnings`

---

## 3. Code Style & Standards

### Rust Constraints
*   **Async Runtime:** Use [`tokio`](https://crates.io/crates/tokio) with multi-threaded features.
*   **Error Handling:** Use [`anyhow`](https://crates.io/crates/anyhow) for application-level binaries, or custom enums with [`thiserror`](https://crates.io/crates/thiserror) if building API crates.
*   **Imports Order:** Group standard library imports (`std::*`) first, followed by third-party external crates, then internal module imports (`crate::*`).
*   **Concurrency:** Use standard async synchronization tools from `tokio::sync` (e.g., `mpsc` channels, `Mutex`, `RwLock`) to communicate between the audio player thread and the UI rendering loop.

### UI Styling (Slint)
*   UI layouts must be defined in separate `.slint` files under `ui/` rather than embedded in Rust macros.
*   UI components must follow a clean, modern aesthetic with styling keys mapped to dynamic variables loaded from the parsed dynamic theme.
*   All layouts should remain responsive and work well on small tiling widths (Niri vertical strips) as well as full-screen landscapes.

---

## 4. Git & Branching Strategy
*   **Branch Naming:**
    *   `feature/sprint-<number>-<description>` for sprint tasks.
    *   `bugfix/<issue-id>-<description>` for bug fixes.
*   **Commit Message Convention:** Follow conventional commits (e.g., `feat: add audio playback engine`, `fix: handle invalid video ids`).
*   **PR Requirement:** PRs must include:
    1. A verification log verifying successful tests and lint passes.
    2. A checklist of environment files or dependencies modified.
