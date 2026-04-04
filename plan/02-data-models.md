# Data Models

## Yarn Catalog

```
Brand
  id: string
  name: string           // e.g. "Istex"
  logoUrl?: string

YarnType
  id: string
  brandId: string
  name: string           // e.g. "Léttlopi"
  weightGrams: number    // ball/skein weight in grams
  metersPerWeight: number
  stitchesPer10cm: number  // gauge (Léttlopi: 18 sts / 10cm on 4.5mm needles)
  rowsPer10cm: number

YarnColor
  id: string
  yarnTypeId: string
  colorCode: string      // manufacturer code, e.g. "0005"
  name: string           // e.g. "Black"
  hex: string            // display color, e.g. "#1a1a1a"
```

## Yarn Selection (user state)

```
YarnSlot
  slotIndex: 0–4         // up to 5 slots
  yarnColorId: string | null
  // resolved at render time: color hex, yarn type density

SelectedYarns
  slots: YarnSlot[5]
  activeSlotIndex: number   // which slot is "painting" in the pattern editor
```

---

## Pattern Grid Dimensions

The README format for pattern sizes is **cols × rows** (width × height):

| Area           | Cols (width, variable) | Rows (height, variable) | Notes                        |
|----------------|------------------------|--------------------------|------------------------------|
| Shirt tail     | 4 – 8                  | 13 – 26                  | Repeating motif around body  |
| Sleeve opening | 4 – 8                  | 13 – 26                  | Same repeat, shared L+R      |
| Yoke           | **12 (fixed)**         | **56 (fixed)**           | See yoke structure below     |

All patterns use **row 0 = bottom of knitting** (knitting convention).
The canvas is flipped vertically for display so row 0 appears at the bottom.

**Grid resize behavior:** When the user changes rows or cols via `GridSizeControls`:
- Existing cells within the new bounds are preserved.
- Rows/columns removed by shrinking are discarded (no undo for this).
- Rows/columns added by growing are initialized to `0` (empty).
- The `resizeGrid(area, rows, cols)` action in `pattern-store` handles this in-place.

---

## Patterns (data structure)

```
PatternArea = "shirtTail" | "sleeveOpening" | "yoke"

PatternGrid
  area: PatternArea
  cols: number           // width — the repeating stitch unit
  rows: number           // height — number of knitting rows
  cells: number[][]      // [row][col], value = slotIndex (1–5) or 0 = empty
                         // cells[0] = bottom row of knitting

DecreaseEntry
  col: number            // 1-indexed column within the 12-stitch repeat
  fromRow: number        // 1-indexed; this column is inactive from fromRow upward

PatternConfig
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid         // shared for both sleeves
  yoke: PatternGrid
  activeArea: PatternArea
  yokeDecreaseSchedule: DecreaseEntry[]   // user-defined column decreases; persisted; initially []
  yokeColorBackup: Record<string, number> // "row,col" → slotIndex saved before a column was decreased
                                          // persisted; used to restore paint when a decrease is removed
  yokeEditMode: "pattern" | "decreases"   // not persisted; always starts in "pattern"
```

### Adjacency constraint for user decreases

Two `DecreaseEntry` values conflict if their columns are immediate neighbours (`|A.col − B.col| === 1`)
**and** they share the same `fromRow`. A k2tog at row R on column C consumes C and its neighbour;
if the neighbour is also decreased at row R the same stitch would need to participate in two
k2tog operations simultaneously (effectively a k3tog), which is not allowed.

The `addDecrease(col, fromRow)` store action checks this before inserting and is a no-op
(with a console warning) if a conflict is found. The UI layer is expected to surface this
as an inline message.

### Color backup mechanism

When `addDecrease(col, fromRow)` is called, any existing painted cells at
`(row ≥ fromRow, col)` are moved out of `yoke.cells` (set to 0) and saved into
`yokeColorBackup` under the key `"row,col"`.

When `removeDecrease(col)` is called, the backed-up entries for that column are written
back into `yoke.cells`, restoring the user's paint.

---

## Yoke Structure

### How the yoke works

The yoke pattern is a **repeating unit** (12 stitches wide, 56 rows tall).
It tiles horizontally around the sweater — the body stitch count determines how many
full repeats fit (14–20 repeats depending on size). The yoke is always 56 rows tall at full size (4XL).

Knitting direction: bottom-up. Row 1 = bottom of yoke (widest). Row 56 = top of yoke (neckline).

### Yoke circumference decrease — column skipping

As the yoke grows upward, certain columns within the 12-stitch repeat are "skipped"
(decreased away). This reduces the active stitch count per repeat, causing the total
circumference to decrease and the yoke to get narrower.

The skip schedule is **predefined** (not user-configurable) for a 12-column repeat:

```
// Column numbers are 1-indexed (1–12).
// Each threshold: at and above this row, the listed columns are inactive.
YOKE_COLUMN_SKIP_SCHEDULE (for 12-col repeat) = [
  { fromRow: 22, skippedCols: [4, 10]              },  // 10 active → 10/12 width
  { fromRow: 37, skippedCols: [3, 4, 10, 11]       },  //  8 active →  8/12 width
  { fromRow: 44, skippedCols: [1, 3, 4, 10, 11]    },  //  7 active →  7/12 width
  { fromRow: 48, skippedCols: [1, 3, 4, 10, 11, 12]},  //  6 active →  6/12 width
  { fromRow: 52, skippedCols: [1, 2, 3, 4, 10, 11, 12]},//  5 active →  5/12 width
  { fromRow: 55, skippedCols: [1,2,3,4, 9,10,11,12]},  //  4 active →  4/12 width
]
```

Stitch count through the yoke (4XL, 20 repeats of 12):

| Rows    | Active cols | Stitches (4XL) | Stitches (S, 14 repeats) |
|---------|-------------|----------------|--------------------------|
| 1 – 21  | 12          | 240            | 168                      |
| 22 – 36 | 10          | 200            | 140                      |
| 37 – 43 |  8          | 160            | 112                      |
| 44 – 47 |  7          | 140            | 98                       |
| 48 – 51 |  6          | 120            | 84                       |
| 52 – 54 |  5          | 100            | 70                       |
| 55 – 56 |  4          | 80             | 56                       |

### Yoke row skipping per size

The 56-row grid represents the full yoke at **4XL**. Smaller sizes skip certain rows,
resulting in a shorter yoke. The row-skip mapping is **predefined in code** as
`YOKE_ROW_SKIP_SIZES` (resolved, see T035).

```
// For each affected grid row (1-indexed), the sizes on which that row is skipped.
// Rows absent from the map are knitted in all sizes.
YOKE_ROW_SKIP_SIZES: Partial<Record<number, SweaterSize[]>>
// e.g.: { 2: ['S','M','L','XL','3XL'], 3: ['S','M','L'], ... }
```

The sweater preview (`useSweaterRenderer`) skips these rows for the active size when
tiling the yoke zone. The pattern editor always shows all rows, with per-row annotations
indicating which sizes skip each row.

### Yoke in the pattern editor — visual representation

Skipped columns must be **visually indicated** in the editor:
- Each row that has column skips applied shows the inactive cells in a distinct visual state
  (e.g., greyed out, cross-hatched, or differently bordered).
- The editor shows the 56-row grid with all 12–24 columns; inactive cells are non-paintable
  and visually distinguished.
- The active/inactive state per cell can be derived from `YOKE_COLUMN_SKIP_SCHEDULE` and
  the current row index.


---

## Sweater Sizes & Stitch Counts

```
SweaterSize = "S" | "M" | "L" | "XL" | "XXL" | "3XL" | "4XL"

// Body stitch count at cast-on (after bottom ribbing)
SHIRT_TAIL_STITCHES = {
  S:   160,  M:   172,  L:   184,  XL:  196,
  XXL: 208,  3XL: 220,  4XL: 232,
}
// Increment: +12 per size step

// Adjusted count before yoke (user adds stitches to reach next multiple of 12)
// All require +8 stitches:
YOKE_START_STITCHES = {
  S:   168,  // 14 × 12
  M:   180,  // 15 × 12
  L:   192,  // 16 × 12
  XL:  204,  // 17 × 12
  XXL: 216,  // 18 × 12
  3XL: 228,  // 19 × 12
  4XL: 240,  // 20 × 12
}
```

---

## Sweater Measurements

```
SweaterMeasurements
  size: SweaterSize
  chestCircumferenceCm: number    // derived: YOKE_START_STITCHES[size] / stitchesPerCm
  bodyLengthCm: number            // neck to bottom hem
  yokeHeightCm: number            // rows knitted (after size-based row skipping) / rowsPerCm
  sleeveLength: number            // shoulder to wrist
  neckCircumferenceCm: number     // derived: 4 active cols × repeats / stitchesPerCm
  stitchesPerCm: number           // from yarn gauge (Léttlopi: 1.8 sts/cm)
```

---

## Sweater Geometry (derived, for 2D preview rendering)

```
SweaterGeometry
  scale: number                    // pixels per cm
  // Body
  bodyWidthPx: number              // chest circumference / 2 (front view only)
  bodyHeightPx: number
  // Yoke (rendered as trapezoid)
  yokeBottomWidthPx: number        // = bodyWidthPx
  yokeTopWidthPx: number           // neckline width
  yokeHeightPx: number
  neckRibbingHeightPx: number      // 5cm
  // Hem
  shirtTailPatternHeightPx: number // patternGrid.rows / rowsPerCm × scale
  shirtTailRibbingHeightPx: number
  // Sleeves
  sleeveWidthPx: number
  sleeveLengthPx: number
  sleeveOpeningPatternHeightPx: number
  sleeveOpeningRibbingHeightPx: number  // 5cm
```

The yoke is rendered as a **stepped trapezoid**: its width changes at each column-skip
threshold row, matching the actual stitch-count reduction. Between thresholds the width
is constant. There are 6 discrete width steps from bottom to neckline.

---

## Yarn Estimation

```
YarnEstimate
  slotIndex: number
  colorName: string
  estimatedGrams: number
  estimatedSkeins: number
  // computed from: total stitches painted with this slot × yarn weight per stitch
```

---

## Application State Summary

```
AppState
  yarns: {
    catalog: { brands, types, colors }     // from YarnCatalogService
    slots: YarnSlot[5]
    activeSlotIndex: number
  }
  patterns: {
    shirtTail: PatternGrid
    sleeveOpening: PatternGrid
    yoke: PatternGrid
    activeArea: PatternArea
    activeDrawingTool: "freehand" | "line" | "eraser"
    yokeDecreaseSchedule: DecreaseEntry[]
    yokeColorBackup: Record<string, number>
    yokeEditMode: "pattern" | "decreases"   // not persisted
  }
  sweater: {
    size: SweaterSize
    geometry: SweaterGeometry              // derived, not persisted
  }
```

## Project Export / Import

The user can export the entire design as a JSON file and re-import it later.
No backend, no multiple projects — one active project at a time, auto-saved to localStorage.

```
ProjectExport
  version: string              // schema version, for future migration
  exportedAt: string           // ISO timestamp
  yarns: {
    slots: YarnSlot[5]
  }
  patterns: {
    shirtTail: PatternGrid
    sleeveOpening: PatternGrid
    yoke: PatternGrid
    yokeDecreaseSchedule: DecreaseEntry[]
    yokeColorBackup: Record<string, number>
  }
  sweater: {
    size: SweaterSize
  }
```

Import replaces the current project after user confirmation.
The yarn catalog itself is not exported (it is always loaded from hardcoded data).
