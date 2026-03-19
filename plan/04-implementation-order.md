# Implementation Order

The implementation is split into phases. Each phase produces something runnable and testable.

---

## Phase 1 — Project Scaffold & Layout Shell

**Goal:** Empty three-panel app running in the browser.

1. `npm create vite` → React + TypeScript template
2. Install dependencies: `zustand`, `immer`
3. Set up `tsconfig.json` (strict, verbatimModuleSyntax)
4. CSS custom properties for dark theme (colors, spacing, typography)
5. `AppToolbar` (placeholder buttons, size dropdown hardcoded to "M")
6. `ThreePanelLayout` with three fixed/flex panels (no content yet)
7. Global reset and base styles

**Deliverable:** App toolbar + three empty labeled panels visible in the browser.

---

## Phase 2 — Type Definitions & Service Abstraction

**Goal:** All shared types defined once; service interface in place before any real code depends on it.

1. `src/types/index.ts` — all data model types
2. `src/services/yarn-catalog-service.ts` — TypeScript interface
3. `src/data/yarn-catalog-data.ts` — hardcoded yarn catalog (Istex: Léttlopi, Álafoss Lopi; Sandnes Garn: Peer Gynt; Novita: Wonder Wool DK — *[see open questions]*)
4. `src/services/hardcoded-yarn-catalog.ts` — implements the interface using hardcoded data

**Deliverable:** Service layer functional, importable, types compile cleanly.

---

## Phase 3 — Yarn Catalog Panel

**Goal:** User can browse yarns and fill their 5 yarn slots.

1. `yarn-store` (Zustand + Immer + persist)
2. `YarnCatalog` root component
3. `BrandSelector` — tabs or list
4. `YarnTypeSelector` — list of yarn types per brand
5. `ColorPalette` — grid of color swatches
6. `YarnSlots` — displays 5 slots, click to select active slot, click again to clear
7. Wire: clicking a color puts it into the active slot

**Deliverable:** Full yarn selection UX working, persisted across page reload.

---

## Phase 4 — Pattern Designer (Grid Editor)

**Goal:** User can draw patterns on grid canvas for each sweater area.

1. `pattern-store` (Zustand + Immer + persist)
2. `useCanvasGrid` hook — renders grid, handles mouse paint events
3. `PatternGrid` component
4. `PatternAreaTabs` — switch between shirtTail / sleeveOpening / yoke
5. `GridSizeControls` — adjust rows/cols within allowed ranges; hidden for yoke
6. `DrawingToolbar` — freehand, line (Bresenham), eraser, fill-all
7. Wire: active slot color from yarn-store → grid painting; inactive cells from
   `YOKE_COLUMN_SKIP_SCHEDULE` passed to `useCanvasGrid` when area is yoke

> ⚠️ `YOKE_ROW_MIN_SIZE` must be filled in before this phase is complete (see Q20).

**Deliverable:** All three patterns editable, persisted, with correct grid constraints and yoke inactive-cell rendering.

---

## Phase 5 — Sweater Preview (Static Shape)

**Goal:** Correct sweater silhouette visible in the preview canvas.

1. `src/utils/sweater-geometry.ts` — compute pixel geometry from measurements
2. `sweater-store` (Zustand + Immer + persist), with derived geometry
3. Wire `AppToolbar` size selector → `sweater-store.setSize(size)`
4. `SweaterCanvas` / `useSweaterRenderer` — draw body + sleeves as flat shapes
5. Solid-color fill (no pattern yet), using slot 1 as main color

**Deliverable:** Correct-proportioned sweater shape reacting to size selection and main color.

---

## Phase 6 — Pattern Texture Mapping

**Goal:** Designed patterns appear on the sweater in the preview.

1. Shirt tail pattern mapped to bottom of body
2. Sleeve opening pattern mapped to bottom of each sleeve
3. Yoke pattern mapped onto stepped trapezoid (width changes at each column-skip threshold)
4. Ribbing areas rendered (simple horizontal lines or solid color)

**Deliverable:** Full visual preview matching the designed patterns.

---

## Phase 7 — Yarn Estimation

**Goal:** Display estimated yarn amounts per slot.

1. `src/utils/yarn-estimation.ts` — area × density → grams, grams / skein weight → skeins
2. `YarnEstimation` component — table of slot / color / grams / skeins
3. Wire to sweater geometry (areas in stitches) + yarn type gauge data

**Deliverable:** Yarn estimation visible and reactive to size/pattern changes.

---

## Phase 8 — Project Export / Import

**Goal:** User can save their design to a file and reload it later.

1. `ProjectExport` type — versioned JSON schema
2. Export: serialize current state → download as `.json` file
3. Import: file picker → parse JSON → validate schema version → confirm dialog → replace state
   - Show user-facing error message if file is not valid JSON or has an unrecognised schema version
4. Wire Export / Import buttons already present in `AppToolbar`

**Deliverable:** Round-trip save/load of the full design (yarn slots + patterns + size).

---

## Phase 9 — Downloadable Knitting Instructions

**Goal:** One-click download of knitting instructions as a plain text (.txt) file.

1. Define instruction template with variable substitution
2. Fill in: yarn names/colors, stitch counts per size, which yoke rows to skip, needle size
3. Wire "Download Instructions" button in `AppToolbar` → triggers browser file download
4. Content spec to be defined in the user story

**Deliverable:** Downloaded .txt document with correct yarn and pattern info.

---

## Future Phases (out of scope for MVP)

- Backend service (REST API) for yarn catalog
- Multiple sweater models / body shapes
- Pattern library (save/load named patterns)
- Per-sleeve pattern customization (left ≠ right)
- Export pattern as image
- Mobile/touch support for pattern drawing

---

## Dependency Graph

```
Phase 1 (scaffold)
  └── Phase 2 (types + services)
        ├── Phase 3 (yarn catalog UI)
        │     └── Phase 4 (pattern designer)
        │           ├── Phase 5 (preview shape)
        │           │     └── Phase 6 (texture mapping)
        │           │           └── Phase 7 (estimation)
        │           │                 └── Phase 8 (instructions)
        └── (Phase 2 also needed for 5, 6, 7, 8)
```
