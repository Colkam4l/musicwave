# Sprint 8 — Material Expressive Design Overhaul

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-8-material-expressive` |
| **Depends On** | Sprint 7 complete and merged to `main` |
| **Status** | ✅ Complete |
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
- [x] **T8-1:** Implement `src/theme/palette.ts`:
  - Offscreen 32x32 `<canvas>` color quantization to extract dominant and vibrant colors from any image URL.
  - Generate full M3 tonal roles: `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, `secondary`, `secondaryContainer`, `surface`, `surfaceContainer`, `surfaceContainerHigh`, `onSurface`, `outline`.
  - Provide fallback default palettes (Violet Glow, Midnight Sapphire, Emerald Grove, Sunset Coral, Golden Hour, Monochrome Slate).
- [x] **T8-2:** Implement `src/theme/dynamicTheme.ts` to inject computed color roles directly into `:root` CSS custom properties with smooth transitions.
- [x] **T8-3:** Create `src/store/themeStore.ts` to manage user preferences:
  - Theme mode: `dynamic` (Album Art) vs `preset` (Curated Palettes).
  - Selected preset theme storage with local storage persistence.
  - Reduced motion toggle with accessibility support.

#### 2. Design Tokens & Global CSS Transition
- [x] **T8-4:** Implement design tokens and CSS variable mapping:
  - Created `src/theme/tokens.ts` defining radii (`cornerFull`, `cornerExtraLarge`, `cornerLarge`), elevations, and spring curves.
  - Backwards-compatible variable injection in `dynamicTheme.ts` aliasing legacy color tokens (`--bg-primary`, `--bg-surface`, `--text-primary`, `--accent-rose`).
  - Purged deprecated glassmorphism blur and transparent glass borders across player bar, sidebar, and cards.

#### 3. Core Component Overhaul to M3 Expressive
- [x] **T8-5:** Create `ExpressiveButton.tsx` and `ExpressiveChip.tsx`:
  - Tactile spring press animation on tap/click (`scale: 0.94`, spring damping).
  - Tonal selection states for genre/shelf filter chips and navigation.
- [x] **T8-6:** Refactor `Sidebar.tsx` (Desktop) and `BottomNav.tsx` (Mobile):
  - Replace static highlights with an expressive floating indicator pill that glides between active routes via Framer Motion `layoutId`.
  - Tonal surface background with subtle elevation line.
- [x] **T8-7:** Redesign `PlayerBar.tsx` and `PlaybackControls.tsx`:
  - Prominent expressive play/pause pill with 48px tactile shape and dynamic primary background.
  - Ambient tonal glow derived from current song artwork.
  - Tonal pills for repeat & shuffle modes.
- [x] **T8-8:** Redesign `NowPlayingModal.tsx` and `LyricsSheet.tsx`:
  - Full-surface dynamic radial gradient transitioning smoothly with track artwork.
  - Active lyric lines highlighted with high-contrast primary font colors and tonal pill background.
- [x] **T8-9:** Update `SongCard.tsx`, `HomePage.tsx`, and `LibraryPage.tsx`:
  - Curvature updated to `rounded-2xl` and `rounded-xl`.
  - Subtle tonal surface elevation on hover with smooth spring lift.

#### 4. Settings & Theme Customization
- [x] **T8-10:** Add "Appearance & Theme" section to `SettingsPage.tsx`:
  - Toggle: "Dynamic Color from Album Art" (enabled by default).
  - Seed color picker for 6 curated palettes (Violet Glow, Midnight Sapphire, Emerald Grove, Sunset Coral, Golden Hour, Monochrome Slate).
  - "Reduced Motion" toggle respecting OS accessibility settings.

#### 5. Verification & Testing
- [x] **T8-11:** Verify color contrast across all dynamic palette variations (ensure text remains readable regardless of album art darkness/brightness).
- [x] **T8-12:** Verify smooth 60fps performance on mobile viewport without GPU lag from legacy backdrop blurs.
- [x] **T8-13:** Run full test suite and builds: `cargo check`, `npm run build`, `cargo test --lib`.

---

## 3. Implementation Notes

### Color Extraction Performance
Color extraction must never block the main rendering thread or stutter audio playback.
1. Draw album art to a hidden downsampled 32x32 canvas.
2. Memoize extracted palettes by `videoId` or image URL to avoid redundant calculations when looping or returning to tracks.
3. Transition CSS variables smoothly via CSS `transition: background-color 400ms cubic-bezier(0.2, 0, 0, 1), color 300ms ease;`.

### Reduced Motion Respect
If `prefers-reduced-motion` is detected or toggled in Settings, Framer Motion springs should fallback to instantaneous or simple linear opacity fades.

---

## 4. Definition of Done

- [x] All glassmorphism blurs replaced with M3 Expressive tonal surface containers.
- [x] Dynamic color palette extracts reliably from song artwork and applies to player, navigation, and accent roles.
- [x] Preset themes available when dynamic color is disabled.
- [x] Desktop navigation rail and mobile bottom nav feature animated indicator pills.
- [x] Now Playing screen features dynamic ambient tonal backdrop and expressive controls.
- [x] TypeScript compiles cleanly with zero warnings (`npm run build`).
- [x] Rust backend builds and passes tests (`cargo check`, `cargo test --lib`).
- [x] End-of-Sprint Report completed in this document.

---

## 5. End-of-Sprint Report

### What Was Built
1. **Material 3 Expressive Design Token System (`src/theme/tokens.ts`):** Complete set of geometric tokens (`cornerFull`, `cornerExtraLarge`, `cornerLarge`), tonal elevation shadow matrices (`level0` through `level4`), and physics-based spring curves (`expressiveSpring`, `tactilePress`).
2. **Dynamic Material You Color Quantizer (`src/theme/palette.ts`):** Fast downsampled canvas quantizer extracting dominant and vibrant colors from album artwork and generating complete M3 tonal roles (`primary`, `primaryContainer`, `surfaceContainer`, `onSurface`, etc.), along with 6 curated fallback presets.
3. **Dynamic Theme Engine & Store (`src/theme/dynamicTheme.ts`, `src/store/themeStore.ts`, `src/hooks/useThemeSync.ts`):** Live DOM variable injector smoothly harmonizing all UI elements with the playing track while keeping backward-compatible aliases.
4. **M3 Expressive Core Component Library (`src/components/common/`):**
   - `ExpressiveButton`: Filled, tonal, outlined, text, and FAB buttons with spring press motion.
   - `ExpressiveChip`: Rounded-full filter chips with tonal selection states.
   - `TonalCard`: Tonal surface container with elevation hierarchy and interactive hover lift.
5. **Component Upgrades:**
   - `Sidebar` & `BottomNav`: Expressive floating indicator pills animated via Framer Motion `layoutId`.
   - `PlayerBar` & `PlaybackControls`: Tactile 48px play/pause pill with M3 primary background, tonal repeat/shuffle indicators, and ambient artwork glow.
   - `SongCard` & `LibraryPage`: Rounded-2xl and rounded-xl cards on tonal container surfaces replacing legacy glass blur.
   - `NowPlayingModal` & `LyricsSheet`: Radial dynamic ambient glow and tonal lyric focus highlighting.
   - `SettingsPage`: Full "Appearance & Expressive Theme" management (Dynamic color switch, 6 palette selectors, and reduced motion accessibility).

### Verification
- `npm run build`: Zero TypeScript errors, production client assets built cleanly in 1.54s.
- `cargo check`: Rust backend checks cleanly with 0 warnings.
- `cargo test --lib`: All 13 unit and integration tests passed (11 offline + 2 network stream/search tests).

### Known Issues / Next Steps
- Sprint 8 fulfills all M3 Expressive design goals. Subsequent sprints can incorporate custom user seed color pickers and additional animations.

