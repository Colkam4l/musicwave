# MusicWave — Sprint Index

This directory contains all sprint planning and post-sprint report documents for the MusicWave project.

> **Related docs:** [CLAUDE.md](../CLAUDE.md) | [SETUP.md](../SETUP.md) | [current-state.md](../current-state.md) | [decisions.md](../decisions.md)

---

## Sprint Conventions

Every sprint document is structured as follows:

| Section | Purpose |
|---|---|
| **Overview** | Goal, branch name, depends-on, estimated scope |
| **Context** | Why this sprint exists — links to relevant ADRs and current-state |
| **Deliverables** | Exact files/modules/features to be created or changed |
| **Implementation Notes** | Key technical constraints the implementing agent must respect |
| **Definition of Done** | Checklist that must pass before the sprint is closed |
| **End-of-Sprint Report** | Filled in *after* implementation; summarizes what was built and how to test it |

Sprint documents are named `SPRINT-N.md` (zero-padded where N is the sprint number).

The implementing agent **must** update the `End-of-Sprint Report` section and commit it to the sprint branch before opening a PR.

---

## Sprint Progress

| # | Name | Branch | Status |
|---|---|---|---|
| [0](./SPRINT-0.md) | Tauri Project Scaffolding | `feature/sprint-0-tauri-scaffold` | ✅ Complete |
| [1](./SPRINT-1.md) | Core Search UI | `feature/sprint-1-search-ui` | ✅ Complete |
| [2](./SPRINT-2.md) | Audio Playback & Player Bar | `feature/sprint-2-player-bar` | ⏳ Next |
| [3](./SPRINT-3.md) | Queue, Library & Navigation | `feature/sprint-3-queue-library` | ⏳ Not Started |
| [4](./SPRINT-4.md) | Polish, Settings & Auth UX | `feature/sprint-4-polish-settings` | ⏳ Not Started |
| [5](./SPRINT-5.md) | Android Port (Tauri Mobile) | `feature/sprint-5-android` | ⏳ Not Started |

---

## Stack Reference (Post-Pivot)

| Layer | Technology | Notes |
|---|---|---|
| Desktop shell | **Tauri v2** | Replaces Slint — see ADR 3 in `decisions.md` |
| Rust backend | tokio · ytmapi-rs · rusty_ytdl · stream-download · rodio | Unchanged from pre-pivot |
| Frontend | **React 18 + TypeScript + Vite** | Lives in `src/` |
| State management | **Zustand** | Lightweight, no Redux boilerplate |
| Animations | **Framer Motion** | Smooth page/component transitions |
| Mobile target | **Tauri v2 Android/iOS** | Same project, Sprint 5 adds the target |
