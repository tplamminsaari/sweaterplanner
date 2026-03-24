# Sweater Planner — Implementation Tasks

## Status legend
`[ ]` open &nbsp; `[x]` done &nbsp; `[!]` blocked (see note)

Tasks are ordered for sequential execution. Each task is scoped to produce a clean,
committable increment. Later tasks will be refined as implementation progresses.

---

## Phase 1 — Project Scaffold

- [x] **T001** — Initialize Vite + React + TypeScript project
  - `npm create vite` in a temp dir, copy into repo root
  - Verify dev server starts (`npm run dev`)
  - Commit: working "Hello World" Vite app

- [x] **T002** — Install dependencies and finalize tsconfig
  - `npm install zustand immer`
  - Configure `tsconfig.json`: strict mode, `verbatimModuleSyntax: true`, path aliases
  - Verify TypeScript compiles with no errors
  - Commit: deps installed, tsconfig locked

- [x] **T003** — Dark theme CSS foundation
  - `index.css`: CSS custom properties for colors, spacing, typography
  - Global reset (box-sizing, margin, font)
  - Commit: design tokens + reset in place

- [x] **T004** — App toolbar shell
  - `AppToolbar.tsx`: size dropdown (hardcoded to "M"), Export / Import / Download Instructions buttons (no-op)
  - Renders at the top of the page
  - Commit: toolbar visible with placeholder controls

- [x] **T005** — Three-panel layout shell
  - `ThreePanelLayout.tsx` + `LeftPanel`, `CenterPanel`, `RightPanel`
  - Correct widths (260px left, flex center, 320px right), full viewport height
  - Each panel shows a label; no real content yet
  - Commit: layout shell renders correctly

---

## Phase 2 — Types and Service Layer

- [x] **T006** — Shared TypeScript types
  - `src/types/index.ts`: all types from `02-data-models.md`
    (`Brand`, `YarnType`, `YarnColor`, `YarnSlot`, `SelectedYarns`,
    `PatternGrid`, `PatternConfig`, `PatternArea`, `SweaterSize`,
    `SweaterMeasurements`, `SweaterGeometry`, `YarnEstimate`, `ProjectExport`,
    `YOKE_COLUMN_SKIP_SCHEDULE` constant)
  - No logic, types only
  - Commit: all types compile cleanly

- [x] **T007** — YarnCatalogService interface + hardcoded implementation
  - `src/services/yarn-catalog-service.ts`: TypeScript interface
    (`getBrands`, `getTypesByBrand`, `getColorsByType`)
  - `src/services/hardcoded-yarn-catalog.ts`: implements the interface
  - `src/data/yarn-catalog-data.ts`: ~20 curated Léttlopi colors with real hex values,
    gauge data (18 sts / 10 cm, 4.5 mm needles), skein weight
  - Commit: service layer functional and type-safe

---

## Phase 3 — Yarn Catalog Panel

- [x] **T008** — yarn-store
  - `src/store/yarn-store.ts`: `persist(immer(...))` with
    `catalog` (brands/types/colors), `slots: YarnSlot[5]`, `activeSlotIndex`
  - Actions: `loadCatalog`, `setActiveSlotIndex`, `assignColorToSlot`, `clearSlot`
  - Commit: store functional, persists to localStorage

- [x] **T009** — Brand and yarn type selectors
  - `BrandSelector.tsx`: tabs or list of brands
  - `YarnTypeSelector.tsx`: list of yarn types for the selected brand
  - Reads from yarn-store catalog; no color selection yet
  - Commit: brand/type navigation works

- [x] **T010** — Color palette
  - `ColorPalette.tsx`: grid of color swatches for the selected yarn type
  - Clicking a swatch calls `assignColorToSlot(activeSlotIndex, colorId)`
  - Commit: color swatches render and are clickable

- [x] **T011** — Yarn slots
  - `YarnSlots.tsx`: row of 5 slots showing assigned color (or empty)
  - Click slot → `setActiveSlotIndex`; click active slot again → `clearSlot`
  - Active slot visually highlighted
  - Commit: full yarn selection UX working end-to-end, persists on reload

---

## Phase 4 — Pattern Designer

- [x] **T012** — pattern-store
  - `src/store/pattern-store.ts`: `persist(immer(...))` with
    initial grids (shirtTail 8×13, sleeveOpening 8×13, yoke 12×56),
    `activeArea`, `activeDrawingTool`
  - Actions: `setActiveArea`, `setDrawingTool`, `setCellColor`, `resizeGrid`, `fillPattern`
  - `resizeGrid`: preserve in-bounds cells, discard out-of-bounds, init new cells to 0
  - Commit: store functional with correct initial state

- [x] **T013** — useCanvasGrid hook (render only)
  - `src/hooks/useCanvasGrid.ts`
  - Renders grid cells with correct colors from `colorMap`; row 0 at canvas bottom
  - `inactiveCells?: Set<string>` param: renders those cells with cross-hatch, non-paintable
  - No mouse interaction yet
  - Commit: grid renders correctly for all three areas

- [x] **T014** — PatternGrid component and area tabs
  - `PatternGrid.tsx`: wraps canvas, wires `useCanvasGrid`, reads from pattern-store
  - `PatternAreaTabs.tsx`: three tabs (Shirt tail / Sleeve opening / Yoke)
  - Switching tabs updates `activeArea` in store
  - Yoke tab: derives inactive cells from `YOKE_COLUMN_SKIP_SCHEDULE` and passes to hook
  - Commit: all three pattern areas viewable

- [x] **T015** — Freehand painting
  - Add mouse/pointer event handling to `useCanvasGrid`
  - Mousedown + drag paints cells with `activeSlotIndex`; dispatches `setCellColor`
  - Commit: user can paint on the grid with freehand

- [x] **T016** — Eraser tool
  - Eraser mode: same pointer events as freehand but sets cell to 0
  - Active tool read from pattern-store
  - Commit: eraser works; switching tools changes behavior

- [x] **T017** — Line tool
  - Mousedown records start cell; drag shows live line preview (no store writes)
  - Mouseup computes end cell; Bresenham algorithm fills cells; dispatches `setCellColor` for each
  - Commit: line tool works with live preview

- [x] **T018** — Drawing toolbar
  - `DrawingToolbar.tsx`: Freehand / Line / Eraser buttons; active tool highlighted
  - Fill Pattern button: fills all paintable cells (active slot color);
    shows confirmation dialog if any cells are non-empty
  - Dispatches `setDrawingTool` and `fillPattern` to pattern-store
  - Commit: full toolbar functional

- [x] **T019** — Grid size controls
  - `GridSizeControls.tsx`: row and col inputs/sliders within allowed ranges
  - Hidden (or disabled) when active area is `yoke` (fixed 12×56)
  - Dispatches `resizeGrid` to pattern-store
  - Commit: resizing works; yoke is locked

---

## Phase 5 — Sweater Preview (shape only)

- [x] **T020** — Sweater geometry utility
  - `src/utils/sweater-geometry.ts`: pure function
    `computeGeometry(size, patterns, gauge) → SweaterGeometry`
  - All pixel dimensions derived from stitch counts + scale factor
  - Commit: utility computes correct geometry for all sizes (verify with unit test or console)

- [x] **T021** — sweater-store and size selector
  - `src/store/sweater-store.ts`: `persist(immer(...))` with `size`, derived `geometry`
  - Action: `setSize(size)` — updates size and recomputes geometry
  - Wire `AppToolbar` size dropdown → `sweater-store.setSize`
  - Commit: changing size updates store and geometry

- [x] **T022** — Sweater canvas (solid color silhouette)
  - `src/hooks/useSweaterRenderer.ts` + `SweaterCanvas.tsx`
  - Draws body rectangle, sleeve rectangles, neck rectangle using slot 1 color
  - Correct proportions per `SweaterGeometry`; re-renders on size or color change
  - Commit: correct sweater silhouette reactive to size and main color

---

## Phase 6 — Pattern Texture Mapping

- [x] **T023** — Shirt tail pattern on body
  - Map shirtTail grid onto the bottom section of the body in the preview
  - Pattern tiles horizontally to fill body width; renders above ribbing band
  - Commit: shirt tail pattern visible on sweater body

- [x] **T024** — Sleeve opening pattern on sleeves
  - Map sleeveOpening grid onto the bottom section of each sleeve
  - Commit: sleeve pattern visible on both sleeves

- [x] **T025** — Yoke pattern on stepped trapezoid
  - Render yoke as 6 discrete width bands matching `YOKE_COLUMN_SKIP_SCHEDULE`
  - Each row stretched to the pixel width of its band; skipped columns not rendered
  - 12-col repeat tiled horizontally across the full width of each band
  - Commit: yoke pattern renders correctly as stepped trapezoid

- [x] **T026** — Ribbing areas
  - Neckhole ribbing (5 cm, solid color), hem ribbing (solid), sleeve opening ribbing (5 cm)
  - Rendered as solid color bands; no pattern
  - Commit: full sweater preview complete with all regions

---

## Phase 7 — Yarn Estimation

- [x] **T027** — Yarn estimation utility
  - `src/utils/yarn-estimation.ts`: for each slot, count painted stitches across all areas,
    multiply by yarn weight per stitch → grams; divide by skein weight → skeins
  - Commit: utility produces correct estimates (verify manually for a simple test case)

- [x] **T028** — Yarn estimation component
  - `YarnEstimation.tsx`: table showing slot color swatch / name / grams / skeins
  - Renders in the right panel below the sweater preview
  - Reactive to pattern and size changes
  - Commit: yarn estimation visible and updating correctly

---

## Phase 8 — Project Export / Import

- [x] **T029** — Project export
  - Serialize `yarns.slots + patterns + sweater.size` to `ProjectExport` JSON
  - Trigger browser download as `sweater-design.json`
  - Wire Export button in `AppToolbar`
  - Commit: export produces a valid, downloadable JSON file

- [x] **T030** — Project import
  - File picker → read JSON → validate schema version
  - Show confirmation dialog ("This will replace your current design")
  - On confirm: replace store state; show user-facing error on invalid file
  - Wire Import button in `AppToolbar`
  - Added `loadGrids` action to pattern-store for bulk grid replacement
  - Commit: round-trip export → import restores design correctly

---

## Phase 9 — Knitting Instructions Download

- [x] **T031** — Knitting instructions generator
  - Added `needleSizeMm` to `YarnType` type and catalog data
  - `src/services/generate-instructions.ts`: plain-text template with yarn slots +
    estimates, needle/gauge info, per-size stitch counts, structure overview,
    yoke decrease schedule, ASCII pattern grids for all three areas
  - Wire Download Instructions button in `AppToolbar`
  - Commit: downloaded `.txt` contains correct yarn and stitch info

---

---

## Phase 10 — UX Improvements

- [ ] **T032** — Resizable left and right panels
  - Left panel (Yarn Catalog, default 260px) and right panel (Sweater Preview, default 320px)
    should be draggable to resize
  - Add drag handle between left/center and center/right panels
  - Enforce reasonable min/max widths (left: 180–400px, right: 220–500px)
  - No library dependency — implement with pointer events on the divider element
  - Check the architecture description in plan-directory and update that if needed because of this task.
  - Commit: both panels resizable by dragging the divider

- [ ] **T033** — Texture-based sweater preview
  - Replace the current geometric canvas preview with a photo-realistic texture renderer
  - **Asset setup**: copy `dist/assets/sweater-texture.png` to `public/sweater-texture.png`
    so it is available as a static asset at runtime
  - **Rendering approach**:
    - Load the texture image onto the canvas as the base layer
    - The texture is white/light-grey; tint each zone by drawing a solid color rectangle
      over it using `globalCompositeOperation = 'multiply'` — this preserves the knit
      weave detail while applying the yarn color
  - **Zone layout** (based on `plan/assets/sweater-structure.png`, back-view image):
    - Neck ribbing: small curved band at the neckline top
    - Yoke pattern: large area from neckline down to the horizontal divider line,
      spanning full body width and the upper portion of both sleeves
    - Tail pattern: horizontal band above the bottom ribbing on the body
    - Body ribbing: bottom hem band
    - Sleeve pattern: horizontal band above the cuff ribbing on each sleeve
    - Sleeve ribbing: cuff band at the end of each sleeve
  - Define zone boundaries as proportional coordinates (0–1) relative to the
    texture image dimensions so they remain correct at any canvas scale
  - Apply the slot color from each pattern area (yoke → slot colors from yoke grid,
    tail → shirt tail grid, sleeve → sleeve opening grid, ribbing → slot 1)
  - The size selector does not change the texture image but can adjust which
    zone boundaries are used if needed
  - Copy reference images to `plan/assets/`:
    - `plan/assets/sweater-structure.png`
    - `plan/assets/sweater-texture.png`
  - Commit: preview uses real sweater texture with correct zone coloring

- [ ] **T034** — Smaller color swatches in the yarn catalog
  - Reduce swatch size in `ColorPalette.tsx` so more colors are visible without scrolling
  - Show color name on hover (tooltip or title attribute) instead of always-visible label
  - Commit: color palette more compact, all colors visible at a glance

- [ ] **T034** — Row numbers on pattern grids
  - Render row numbers along the left edge of each pattern grid canvas in `useCanvasGrid`
  - Numbering goes bottom-up (row 1 at canvas bottom), matching knitting convention
  - Use a muted, low-contrast color (e.g. ~40% opacity of the text color) so numbers
    are readable without competing with the pattern
  - Account for the number column width so grid cells are not obscured
  - Commit: row numbers visible on all three pattern grids

- [ ] **T035** — Implement yoke row skipping per size
  - The existing `YOKE_ROW_MIN_SIZE` type assumes a simple minimum-size threshold, but the
    actual skip pattern is non-monotonic (e.g. row 2 is skipped on 3XL but not XXL).
    Replace it with a more flexible structure: `YOKE_ROW_SKIP_SIZES: Partial<Record<number, SweaterSize[]>>`
    listing the exact sizes on which each row is skipped.
  - Fill in the data (rows absent from the map are knitted in all sizes):
    - Row 2:  skip on S, M, L, XL, 3XL
    - Row 3:  skip on S, M, L
    - Row 11: skip on S, M
    - Row 25: skip on S
    - Row 32: skip on S, M, L, XL
    - Row 39: skip on S
    - Row 47: skip on S, M, L, XL, XXL, 3XL
    - Row 50: skip on S, M, L, XL, XXL
    - Row 53: skip on S, M, L
  - Update `useSweaterRenderer` to skip these rows when drawing the yoke for the active size
  - In the yoke pattern editor (`useCanvasGrid`), mark skipped rows for the current size
    as inactive (visually dimmed, non-paintable) — similar to how inactive columns work
  - Update all references to `YOKE_ROW_MIN_SIZE` throughout the codebase
  - Commit: yoke rendering and editor correctly reflect per-size row skipping

- [ ] **T036** — Include yoke row skipping in downloaded instructions
  - In `generate-instructions.ts`, add a section listing which rows are skipped per size
  - For the current size, list the skipped row numbers explicitly
  - Also print a compact full table (all sizes × all affected rows) so the knitter
    can see the complete picture at a glance
  - Commit: instructions include accurate per-size yoke row skip info

- [ ] **T037** ⚠️ LOW PRIORITY — UI localization (English, Finnish, Swedish)
  - Install `i18next` and `react-i18next`
  - Extract all user-visible strings from components into translation files:
    `src/locales/en.json`, `src/locales/fi.json`, `src/locales/sv.json`
  - Strings to cover: panel labels, toolbar buttons, yarn catalog headings,
    drawing tool names, pattern area tab names, grid size controls,
    yarn estimation table headers, error messages
  - Add a language selector to `AppToolbar` (e.g. EN / FI / SV toggle)
  - Persist the selected language to localStorage
  - The downloaded instructions `.txt` file should also be generated in the
    selected language
  - Commit: full UI translatable; EN/FI/SV translations complete

---

## Blocked / needs input before implementation

- `[x]` **Q20** — `YOKE_ROW_MIN_SIZE`: which grid rows are skipped per size?
  Resolved — data provided, see T035 for implementation.

