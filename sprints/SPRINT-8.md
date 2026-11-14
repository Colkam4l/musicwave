# Sprint 8 — Material Expressive Design Overhaul

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-8-material-expressive` |
| **Depends On** | Sprint 7 complete and merged to `main` |
| **Status** | ⏳ Planned |
| **Scope** | ~3 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md) · [Feature Gap Report](../.gemini/antigravity/brain/116d04ef-f500-4d5c-b6da-47162cfcbb50/musicwave-feature-gap-and-roadmap-report.md)

---

## 1. Context

During Sprints 0–4, MusicWave utilized a "Liquid Glass" / dark glassmorphism design language characterized by semi-transparent panels, `backdrop-filter: blur()`, glowing borders, and fixed neon accents. While visually striking in static mocks, this approach presented several challenges in production:
1. **GPU & Battery Overhead:** Heavy backdrop blur cascading across nested panels on mobile and lower-spec desktop hardware strains GPU compositing.
2. **Readability & Contrast:** Glass backgrounds reduce text legibility across varying album artwork backdrops, complicating WCAG AA compliance.
3. **Rigid Visual Identity:** Fixed accent colors feel detached from the music being played.

Sprint 8 transitions MusicWave to **Google Material 3 Expressive (M3 Expressive)**:
- **Dynamic Color (Material You):** Automatically extracts tonal color palettes from the active track's album art (or user-chosen seed themes), generating matching Primary, Secondary, Tertiary, Surface, and Container roles in real time.
- **Tonal Elevation Hierarchy:** Replaces transparent glass borders and heavy blur with crisp tonal surface containers (`surface-container-lowest` through `surface-container-highest`), creating clear visual depth and structure.
- **Expressive Shapes & Geometry:** Full pills (`rounded-full`) for interactive chips, search bars, and action buttons; expressive curved cards (`rounded-3xl` / `rounded-2xl`); and tactile FAB controls.
- **Expressive Spring Physics:** Fluid spring transitions (`framer-motion` with damping and stiffness) for sheet expansions, bottom sheets, navigation pills, and button press bounces.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src/
├── theme/
│   ├── palette.ts              # CREATE — color extraction from artwork (canvas quantize) & M3 tonal roles
│   ├── tokens.ts               # CREATE — M3 Expressive design tokens (shapes, motion, elevations, typography)
│   └── dynamicTheme.ts         # CREATE — CSS variable injector for real-time DOM theme updates
├── store/
│   └── themeStore.ts           # CREATE — active theme mode (Dynamic, Midnight, Sunset, Emerald, Ocean) & contrast
├── components/
│   ├── NavigationRail.tsx      # MODIFY — expressive vertical rail for desktop with animated indicator pills
│   ├── BottomNav.tsx           # MODIFY — expressive mobile navigation bar with M3 pill indicators
│   ├── PlayerBar.tsx           # MODIFY — expressive tonal player with ambient album glow and tactile pill buttons
│   ├── PlaybackControls.tsx    # MODIFY — expressive play/pause pill, spring icon toggles for shuffle/repeat
│   ├── SongCard.tsx            # MODIFY — expressive rounded-2xl cards with tonal surface hover states
│   ├── LyricsSheet.tsx         # MODIFY — full-screen dynamic tonal gradient backdrop matched to album art
│   └── common/
│       ├── ExpressiveButton.tsx # CREATE — M3 filled, tonal, outlined, and elevated button variants with spring press
│       ├── ExpressiveChip.tsx   # CREATE — filter chips and genre badges with tonal selection states
│       └── TonalCard.tsx        # CREATE — surface container wrapper with expressive elevation
├── pages/
│   ├── HomePage.tsx            # MODIFY — expressive carousel and shelf layouts
│   ├── SearchPage.tsx          # MODIFY — expressive pill search bar and tonal category grid
│   ├── LibraryPage.tsx         # MODIFY — expressive segmented tabs and playlist cards
│   └── SettingsPage.tsx        # MODIFY — Material You theme customization & dynamic color toggles
└── index.css                   # MODIFY — replace glassmorphism utility classes with M3 tonal CSS variables
```

---

## 2.2 Tasks

#### 1. Dynamic Color Extraction & Token Engine
- [ ] **T8-1:** Implement `src/theme/palette.ts`:
  - Offscreen 64x64 `<canvas>` color quantization to extract dominant and vibrant colors from any image URL.
  - Generate full M3 tonal roles: `primary`, `on_primary`, `primary_container`, `on_primary_container`, `secondary`, `secondary_container`, `surface`, `surface_container`, `surface_container_high`, `on_surface`, `outline`.
  - Provide fallback default palettes (Midnight, Emerald, Sunset, Ocean, Monochromatic).
- [ ] **T8-2:** Implement `src/theme/dynamicTheme.ts` to inject computed color roles directly into `:root` CSS custom properties with smooth transitions.
- [ ] **T8-3:** Create `src/store/themeStore.ts` to manage user preferences:
  - Theme mode: `Dynamic (Album Art)`, `Preset Theme`, or `System`.
  - Contrast mode: `Standard` vs `High Contrast`.
  - Animation speed: `Full Expressive`, `Standard`, or `Reduced Motion`.

#### 2. Design Tokens & Global CSS Transition
- [ ] **T8-4:** Update `tailwind.config.js` and `src/index.css`:
  - Map Tailwind color classes to M3 CSS variables (`bg-surface-container`, `text-on-surface`, `bg-primary`, etc.).
  - Define expressive border radii (`rounded-4xl: 32px`, `rounded-3xl: 24px`, `rounded-2xl: 16px`, `rounded-pill: 9999px`).
  - Purge deprecated glassmorphism classes (`glass-panel`, `glass-border`, heavy `backdrop-blur-xl`).

#### 3. Core Component Overhaul to M3 Expressive
- [ ] **T8-5:** Create `ExpressiveButton.tsx` and `ExpressiveChip.tsx`:
  - Tactile spring press animation on tap/click (`scale: 0.95`, spring damping: 15).
  - Tonal selection states for genre/shelf filter chips.
- [ ] **T8-6:** Refactor `NavigationRail.tsx` (Desktop) and `BottomNav.tsx` (Mobile):
  - Replace static highlights with an expressive floating indicator pill that glides between active routes via Framer Motion `layoutId`.
  - Tonal surface background with subtle elevation line.
- [ ] **T8-7:** Redesign `PlayerBar.tsx` and `PlaybackControls.tsx`:
  - Prominent expressive play/pause pill with morphing icon animation.
  - Dynamic ambient tonal glow derived from current song artwork.
  - Tactile slider with expressive thumb expansion during scrub.
- [ ] **T8-8:** Redesign `NowPlayingModal.tsx` and `LyricsSheet.tsx`:
  - Full-surface dynamic gradient transitioning seamlessly as track artwork changes.
  - Active lyric lines highlighted with high-contrast `on-surface` font weights while inactive lines dim to `on-surface-variant`.
- [ ] **T8-9:** Update `SongCard.tsx`, `AlbumCard.tsx`, and `PlaylistCard.tsx`:
  - Curvature updated to `rounded-3xl` / `rounded-2xl`.
  - Subtle tonal surface elevation on hover with smooth spring lift (`translateY(-4px)`).

#### 4. Settings & Theme Customization
- [ ] **T8-10:** Add "Appearance & Theme" section to `SettingsPage.tsx`:
  - Toggle: "Dynamic Color from Album Art" (enabled by default).
  - Seed color picker for static mode (Vibrant Blue, Deep Violet, Forest Green, Coral, Monochrome).
  - "Reduced Motion" toggle respecting OS accessibility settings.

#### 5. Verification & Testing
- [ ] **T8-11:** Verify color contrast across all dynamic palette variations (ensure text remains readable regardless of album art darkness/brightness).
- [ ] **T8-12:** Verify smooth 60fps performance on mobile viewport without GPU lag from legacy backdrop blurs.
- [ ] **T8-13:** Run full test suite and builds: `cargo check`, `npm run build`, `npx tauri build --debug --no-bundle`.

---

## 3. Implementation Notes

### Color Extraction Performance
Color extraction must never block the main rendering thread or stutter audio playback.
1. Draw album art to a hidden downsampled 64x64 canvas.
2. Memoize extracted palettes by `videoId` or image URL to avoid redundant calculations when looping or returning to tracks.
3. Transition CSS variables smoothly via CSS `transition: background-color 400ms cubic-bezier(0.2, 0, 0, 1), color 300ms ease;`.

### Reduced Motion Respect
If `prefers-reduced-motion` is detected or toggled in Settings, Framer Motion springs should fallback to instantaneous or simple linear opacity fades.

---

## 4. Definition of Done

- [ ] All glassmorphism blurs replaced with M3 Expressive tonal surface containers.
- [ ] Dynamic color palette extracts reliably from song artwork and applies to player, navigation, and accent roles.
- [ ] Preset themes available when dynamic color is disabled.
- [ ] Desktop navigation rail and mobile bottom nav feature animated indicator pills.
- [ ] Now Playing screen features dynamic ambient tonal backdrop and expressive controls.
- [ ] TypeScript compiles cleanly with zero warnings (`npm run build`).
- [ ] Rust backend builds and passes tests (`cargo check`, `cargo test --lib`).
- [ ] End-of-Sprint Report completed in this document.

---

## 5. End-of-Sprint Report

<!--
This section is filled in AFTER Sprint 8 is implemented.
-->

### What Was Built
_Summary of the Material 3 Expressive redesign._

### Verification
_How the theme engine and components were verified across desktop and mobile viewports._

### Known Issues / Next Steps
_Any remaining visual polish items for future maintenance._

