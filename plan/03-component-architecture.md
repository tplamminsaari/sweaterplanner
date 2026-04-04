# Component Architecture

## Directory Structure

```
src/
├── main.tsx
├── App.tsx                        # App toolbar + three-panel shell
├── index.css                      # CSS variables, global styles
│
├── services/
│   ├── yarn-catalog-service.ts    # YarnCatalogService interface
│   ├── hardcoded-yarn-catalog.ts  # Hardcoded implementation (Ístex, Sandnes Garn)
│   ├── generate-instructions.ts   # Knitting instructions text generator + download
│   ├── project-export.ts          # Serialize current project to JSON file
│   └── project-import.ts          # Parse + validate JSON file, load into stores
│
├── data/
│   └── yarn-catalog-data.ts       # Brands, types, colors (Ístex Léttlopi/Álafoss, Sandnes Peer Gynt)
│
├── store/
│   ├── yarn-store.ts              # persist(immer(...))
│   ├── pattern-store.ts           # persist(immer(...))
│   └── sweater-store.ts           # persist(immer(...))
│
├── types/
│   └── index.ts                   # All shared TypeScript types/interfaces
│
├── hooks/
│   ├── useCanvasGrid.ts           # Canvas drawing for pattern grids
│   └── useSweaterRenderer.ts      # Canvas rendering for sweater preview
│
├── utils/
│   ├── bresenham.ts               # Bresenham line algorithm for line tool
│   ├── sweater-geometry.ts        # Compute SweaterGeometry from size + patterns
│   ├── yarn-estimation.ts         # Compute grams/skeins per slot
│   └── yoke-decreases.ts          # deriveInactiveCells() pure helper for decrease schedule
│
└── components/
    ├── layout/
    │   ├── AppToolbar.tsx          # New, Size selector, Export, Import, Download Instr.
    │   └── ThreePanelLayout.tsx    # Manages left/right widths; renders drag dividers
    │
    ├── yarn/
    │   ├── YarnCatalogPanel.tsx    # Root of left panel
    │   ├── BrandSelector.tsx       # Brand tabs
    │   ├── YarnTypeSelector.tsx    # Yarn type list within brand
    │   ├── ColorPalette.tsx        # Grid of color swatches
    │   └── YarnSlots.tsx           # 5 yarn slots on left edge of pattern editor
    │
    ├── pattern/
    │   ├── PatternDesignerPanel.tsx # Root of center panel
    │   ├── PatternAreaTabs.tsx      # Tab: shirtTail / sleeveOpening / yoke
    │   ├── PatternGrid.tsx          # Canvas-based grid editor + row tooltip
    │   ├── GridSizeControls.tsx     # Row/col inputs (hidden for yoke)
    │   └── DrawingToolbar.tsx       # Tool selector (freehand / line / eraser) + fill-all
    │
    └── preview/
        ├── SweaterPreviewPanel.tsx  # Root of right panel
        ├── SweaterCanvas.tsx        # Canvas rendering + zoom/pan
        └── YarnEstimation.tsx       # Estimated gram/skein counts per slot
```

## Key Component Responsibilities

### `App.tsx`
- Initializes stores
- Renders `ThreePanelLayout`
- On first load: calls `YarnCatalogService.getBrands()` etc. and populates yarn store

### `ThreePanelLayout.tsx`
- Owns `leftWidth` and `rightWidth` state (initial: 260px, 320px)
- Renders a `.panel-divider` drag handle between left/center and center/right panels
- Drag handles use pointer capture (`setPointerCapture`) to track moves outside the element
- Enforces min/max constraints: left 180–400px, right 220–500px
- Panel widths applied via inline `style` so the center panel takes all remaining flex space

### `PatternGrid.tsx`
- Receives `PatternGrid` data and `YarnSlots` color map from store
- Renders via `useCanvasGrid` hook
- Handles mouse events based on active drawing tool and `yokeEditMode`:
  - **Pattern mode — Freehand**: mousedown + drag paints each cell the cursor passes over
  - **Pattern mode — Line**: mousedown records start cell; mouseup records end cell; Bresenham line algorithm fills cells between them; live preview shown during drag
  - **Decrease mode** (yoke only): drag is disabled; single click on a cell toggles a user-defined
    decrease for that column starting at the clicked row — calls `addDecrease`, `removeDecrease`, or
    replaces an existing entry. Constraint violations surface an inline warning.
- On cell paint: dispatches to pattern-store
- **Row number tooltip**: tracks mouse position over the canvas; when the cursor is in the label
  area (x < labelWidth), shows a fixed-position HTML tooltip. For the yoke grid the tooltip reads
  "Row N — skipped for [size]" when the row is skipped on the active size; otherwise "Row N".

### Yoke decrease mode toggle

A **"Decrease Schedule"** button in the yoke tab's toolbar (visible only when the yoke area is
active) dispatches `setYokeEditMode("decreases")` / `setYokeEditMode("pattern")` to toggle between
the two modes. The active mode is reflected in button style.

In **Decrease mode**, `useCanvasGrid` receives `decreasedCells` (from `yokeDecreaseSchedule`) and
renders them with a distinct visual style (e.g. diagonal accent stripe) so they are visually
distinguishable from predefined inactive cells (cross-hatch). In **Pattern mode** both predefined
and user-decreased cells behave identically (non-paintable, same inactive style).

### `DrawingToolbar.tsx`
- Tool selector: **Freehand** | **Line** | **Eraser**
  - Eraser sets cell value to `0` (empty) on mouse drag, same pointer event logic as freehand.
- **Fill Pattern** button: fills all paintable cells with the active yarn slot color.
  - If any cells are already painted (non-empty), shows a confirmation dialog before proceeding.
  - Dispatches `fillPattern(area, slotIndex)` to pattern-store.
  - For the yoke area, only active (non-skipped) cells are filled.
- **GridSizeControls** are hidden (or disabled) when the active area is `yoke` (fixed 12×56).

### `AppToolbar.tsx`
- **New** button: confirms then calls `resetSlots()` + `resetPatterns()` to clear the design
- Size selector: drives `sweater-store.setSize()`
- Export / Import / Download Instructions buttons

### `SweaterCanvas.tsx`
- Reads patterns, yarn slots, and active size from stores
- Freezes pattern snapshot while the user is actively drawing (deferred re-render runs once per completed stroke, not on every cell paint)
- Renders via `useSweaterRenderer` hook
- Supports zoom (wheel + pinch) and pan (drag); double-click resets

### `useCanvasGrid` hook
```
Input:
  cols, rows: number
  cells: number[][]
  colorMap: Record<number, string>          // slotIndex → hex
  inactiveCells?: ReadonlySet<string>       // "row,col" (1-indexed); predefined non-paintable cells
  rowSkipAnnotations?: ReadonlyMap<number, string>  // row1 → annotation text (widens label area)
  activeTool?: DrawingTool                  // "freehand" | "line" | "eraser"
  paintSlot?: number                        // slot index used for painting (1-indexed; 0 = eraser)
  onStrokeStart?: () => void                // called once at start of each paint stroke
  onStrokeEnd?: () => void                  // called once when stroke ends
  onCellPaint?: (row, col) => void          // freehand/eraser per-cell callback (0-indexed)
  onLinePaint?: (cells: {row,col}[]) => void // line tool on pointer-up (0-indexed)

Output: RefObject<HTMLCanvasElement>
Side effect: sets canvas dimensions, draws grid, attaches pointer event handlers

Cell size is a fixed constant (CELL_SIZE = 20px).
Inactive cells: rendered with dark cross-hatch fill; excluded from pointer hit-testing.
rowSkipAnnotations: when present, label area widens to ANNOTATED_ROW_NUM_WIDTH (48px)
  and each annotated row shows the row number + annotation text (e.g. "S M L").
```

*Note: `decreasedCells` and `editMode` inputs are planned for T040 (decrease schedule UI) and not yet implemented.*

### Constraint validation

`addDecrease(col, fromRow)` in `pattern-store`:
1. Check adjacency: for each existing `DecreaseEntry` E where `|E.col − col| === 1`, verify
   that the new entry's active row range does not overlap E's range. If it does, reject with
   a console warning (UI layer surfaces this as a toast or inline message).
2. Save displaced colors: for all `(row ≥ fromRow, col)` cells with a non-zero value, write
   to `yokeColorBackup["row,col"]` and clear the cell in `yoke.cells`.
3. Push `{ col, fromRow }` onto `yokeDecreaseSchedule`.

`removeDecrease(col)`:
1. Remove the entry for `col` from `yokeDecreaseSchedule`.
2. Restore any backed-up cells for that column from `yokeColorBackup` into `yoke.cells`.
3. Delete restored keys from `yokeColorBackup`.

### `useSweaterRenderer` hook
```
Input:
  colorMap: Record<number, string>   // slotIndex (1-based) → hex color
  patterns: { shirtTail, sleeveOpening, yoke: PatternGrid }
  size: SweaterSize                  // active size; determines which yoke rows are skipped

Output: RefObject<HTMLCanvasElement>
Side effect: loads sweater-texture.png, draws 280×280px canvas each time inputs change

Rendering pipeline (per frame):
  1. Dark background fill
  2. Knit texture image (alpha silhouette clips to sweater outline)
  3. multiply-composite tint for each zone:
     - Solid zones (body, ribbing, sleeves, neck): filled with slot-1 base color
     - Patterned zones (yoke, shirt tail, sleeve openings): per-cell tiled render
       using colorMap; yoke additionally respects YOKE_COLUMN_SKIP_SCHEDULE and
       YOKE_ROW_SKIP_SIZES[row].includes(size) for row skipping
```

## State Flow

```
User clicks a slot in YarnSlots (vertical column on left edge of PatternDesignerPanel)
  → yarn-store: setActiveSlotIndex(slotIndex)   // switches which slot is being painted

User clicks a color in ColorPalette
  → yarn-store: assignColorToSlot(activeSlotIndex, yarnColorId)  // assigns color to active slot

User clicks a slot twice (toggle) or presses clear
  → yarn-store: clearSlot(slotIndex)            // sets yarnColorId to null

User clicks/drags PatternGrid cell
  → pattern-store: setCellColor(area, row, col, activeSlotIndex)
  → PatternGrid re-renders via useCanvasGrid
  → SweaterCanvas re-renders via useSweaterRenderer (reactive to store)

User changes grid size
  → pattern-store: resizeGrid(area, rows, cols)
  → PatternGrid re-renders
  → geometry recalculated in sweater-store

User changes sweater size
  → sweater-store: setSize(size)
  → geometry recalculated in sweater-store
  → SweaterCanvas re-renders (size passed to useSweaterRenderer for row skipping)

User clicks New
  → window.confirm() → yarn-store: resetSlots() + pattern-store: resetPatterns()
  → all grids reset to initial state, undo stack cleared
```

## Canvas Coordinate System

- Pattern grid: cell (row, col), row 0 = bottom of knitting, drawn flipped (row 0 at canvas bottom)
- Sweater preview: origin top-left, Y increases downward
- Yoke taper: the yoke is a **stepped trapezoid** — width is constant within each column-skip band,
  then jumps at threshold rows (6 discrete steps). Each pattern row is rendered at the pixel width
  corresponding to its band (not smoothly interpolated). Each cell in a row is stretched uniformly
  to fill the row's width.
