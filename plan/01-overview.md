# Sweater Planner — Architecture Overview

## Purpose

A browser-based tool for planning Icelandic-style sweaters. The user selects yarns, designs knitting patterns for different parts of the sweater, and sees a 2D preview with the patterns applied.

## Tech Stack

- **Vite + React 19 + TypeScript** (strict mode, `verbatimModuleSyntax`)
- **Zustand + Immer** — state management with localStorage persistence
- **HTML Canvas API** — pattern grids and sweater preview rendering
- **CSS custom properties** — dark theme

## App Toolbar (top bar)

A narrow fixed bar spanning the full width above the three panels:

- **Size selector** — dropdown for S → 4XL (affects geometry + yoke row skipping)
- **Export** button — downloads design as `.json`
- **Import** button — opens file picker, replaces design after confirmation
- **Download Instructions** button — downloads `.txt` knitting instructions

This keeps global actions out of the three panels and gives them a stable location.

---

## Three-Panel Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Size: M ▾]   [Export]  [Import]  [Download Instr.]    │  ← App Toolbar
├──────────────────────────────────────────────────────────┤
│  Yarn Catalog  │     Pattern Designer     │   Sweater    │
│   (260px)      │      (flex, center)      │  Preview     │
│                │                          │  (320px)     │
└──────────────────────────────────────────────────────────┘
```

### Panel 1 — Yarn Catalog (left)
- Hierarchical selection: Brand → Yarn Type → Color palette
- User picks up to 5 yarn "slots" (each slot = one color used in the sweater)
- Slot 1 is typically the main/background color
- Data is hardcoded initially but behind a service abstraction for future backend

### Panel 2 — Pattern Designer (center)
Three pattern areas, switchable via tabs:
1. **Shirt tail** — grid 4–8 cols wide × 13–26 rows tall (tiling motif, repeats around body)
2. **Sleeve openings** — same range; shared for both sleeves
3. **Yoke** — grid **12 cols wide (fixed)** × **56 rows tall (fixed)**

All grids: row 0 = bottom of knitting. Canvas flipped vertically for display.

**Yoke specifics:** The 12-col repeat tiles around the body circumference.
As rows increase upward, certain columns become inactive per a predefined skip schedule —
this is how the yoke narrows toward the neckline. Inactive cells are visually distinguished
in the editor (non-paintable, greyed out).

### Panel 3 — Sweater Preview (right)
2D front view of the sweater. Renders the sweater silhouette and texture-maps the patterns to their correct positions.

**Sweater structure (top to bottom):**
- Neckhole ribbing (5 cm, solid color)
- Yoke (tapered — fewer stitches at top than bottom, pattern applied)
- Body base (solid, main color)
- Shirt tail pattern
- Shirt tail ribbing (solid)

**Sleeve structure (attached at yoke):**
- Base (solid, slightly tapers toward opening)
- Sleeve opening pattern
- Sleeve opening ribbing (5 cm, solid)

## Data Abstraction for Future Backend

Two service interfaces are defined as TypeScript abstractions from the start:

- `YarnCatalogService` — `getBrands()`, `getTypesByBrand(brandId)`, `getColorsByType(typeId)`
- `SweaterModelService` — `getModels()` (future: different sweater body shapes)

Phase 1 uses hardcoded implementations. Phase 2+ can swap to REST/GraphQL without rewriting UI.

## State Management (Zustand stores)

| Store | Responsibility |
|---|---|
| `yarn-store` | Available catalog data + user's 5 yarn slots |
| `pattern-store` | Grid data for all three pattern areas + current active pattern + grid sizes |
| `sweater-store` | Sweater measurements, size selection, derived geometry |

All stores use `persist(immer(...))` middleware to save to localStorage.

## Yarn Amount Estimation

Given:
- Yarn density (stitches/cm² from yarn catalog)
- Sweater size/measurements (cm)
- Area of each pattern region

The app computes estimated grams per yarn slot.

## Downloadable Knitting Instructions

Template-based text/PDF document that is filled with:
- Selected yarn names and colors
- Pattern dimensions
- Stitch counts derived from size

Not a dynamic pattern generator — a fixed template with variable substitution.
