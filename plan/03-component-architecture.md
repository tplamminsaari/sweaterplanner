# Component Architecture

## Directory Structure

```
src/
├── main.tsx
├── App.tsx                        # App toolbar + three-panel shell
├── index.css                      # CSS variables, global styles
│
├── services/                      # Backend abstraction layer
│   ├── yarn-catalog-service.ts    # Interface definition
│   ├── hardcoded-yarn-catalog.ts  # Phase 1 implementation
│   └── sweater-model-service.ts   # Interface (future use)
│
├── data/                          # Hardcoded data
│   └── yarn-catalog-data.ts       # Brands, types, colors (Istex, Novita, etc.)
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
│   ├── sweater-geometry.ts        # Compute SweaterGeometry from measurements
│   └── yarn-estimation.ts         # Compute grams/skeins per slot
│
└── components/
    ├── layout/
    │   ├── AppToolbar.tsx          # Size selector, Export, Import, Download Instr.
    │   ├── ThreePanelLayout.tsx
    │   ├── LeftPanel.tsx
    │   ├── CenterPanel.tsx
    │   └── RightPanel.tsx
    │
    ├── yarn-catalog/
    │   ├── YarnCatalog.tsx         # Root of left panel
    │   ├── BrandSelector.tsx       # Brand tabs or list
    │   ├── YarnTypeSelector.tsx    # Yarn type list within brand
    │   ├── ColorPalette.tsx        # Grid of color swatches
    │   └── YarnSlots.tsx           # The 5 active yarn slots
    │
    ├── pattern-designer/
    │   ├── PatternDesigner.tsx     # Root of center panel
    │   ├── PatternAreaTabs.tsx     # Tab: shirtTail / sleeveOpening / yoke
    │   ├── PatternGrid.tsx         # Canvas-based grid editor
    │   ├── GridSizeControls.tsx    # Row/col sliders or inputs (disabled for yoke)
    │   └── DrawingToolbar.tsx      # Tool selector (freehand / line / eraser) + fill-all
    │
    └── sweater-preview/
        ├── SweaterPreview.tsx      # Root of right panel
        ├── SweaterCanvas.tsx       # Canvas rendering the full preview
        └── YarnEstimation.tsx      # Shows estimated gram/skein counts
```

## Key Component Responsibilities

### `App.tsx`
- Initializes stores
- Renders `ThreePanelLayout`
- On first load: calls `YarnCatalogService.getBrands()` etc. and populates yarn store

### `PatternGrid.tsx`
- Receives `PatternGrid` data and `YarnSlots` color map from store
- Renders via `useCanvasGrid` hook
- Handles mouse events based on active drawing tool:
  - **Freehand**: mousedown + drag paints each cell the cursor passes over
  - **Line**: mousedown records start cell; mouseup records end cell; Bresenham line algorithm fills cells between them; live preview shown during drag
- On cell paint: dispatches to pattern-store

### `DrawingToolbar.tsx`
- Tool selector: **Freehand** | **Line** | **Eraser**
  - Eraser sets cell value to `0` (empty) on mouse drag, same pointer event logic as freehand.
- **Fill Pattern** button: fills all paintable cells with the active yarn slot color.
  - If any cells are already painted (non-empty), shows a confirmation dialog before proceeding.
  - Dispatches `fillPattern(area, slotIndex)` to pattern-store.
  - For the yoke area, only active (non-skipped) cells are filled.
- **GridSizeControls** are hidden (or disabled) when the active area is `yoke` (fixed 12×56).

### `SweaterCanvas.tsx`
- Receives full `AppState` (patterns + yarn slots + geometry)
- Renders via `useSweaterRenderer` hook
- Re-renders whenever patterns or yarns change

### `useCanvasGrid` hook
```
Input:  canvasRef, grid: PatternGrid, colorMap: string[], cellSize: number,
        inactiveCells?: Set<`${row},${col}`>   // cells that are non-paintable (yoke skips)
Output: { repaint: () => void }
Side effect: draws grid on canvas, attaches pointer event handlers

Inactive cells are rendered with a distinct style (e.g., dark cross-hatch fill).
Pointer events on inactive cells are ignored — they cannot be painted or erased.
The caller (PatternGrid) derives `inactiveCells` from YOKE_COLUMN_SKIP_SCHEDULE
when the active area is "yoke"; passes undefined for shirtTail and sleeveOpening.
```

### `useSweaterRenderer` hook
```
Input:  canvasRef, geometry: SweaterGeometry, patterns: PatternConfig, slots: YarnSlot[]
Output: { repaint: () => void }
Side effect: renders sweater silhouette + texture-mapped patterns
```

## State Flow

```
User clicks a slot in YarnSlots
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
  → geometry recalculated
  → SweaterCanvas re-renders
```

## Canvas Coordinate System

- Pattern grid: cell (row, col), row 0 = bottom of knitting, drawn flipped (row 0 at canvas bottom)
- Sweater preview: origin top-left, Y increases downward
- Yoke taper: the yoke is a **stepped trapezoid** — width is constant within each column-skip band,
  then jumps at threshold rows (6 discrete steps). Each pattern row is rendered at the pixel width
  corresponding to its band (not smoothly interpolated). Each cell in a row is stretched uniformly
  to fill the row's width.
