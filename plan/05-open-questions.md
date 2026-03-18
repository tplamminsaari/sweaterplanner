# Open Questions

Status legend: ✅ Answered | ❓ Still open

---

## Yarn Catalog

✅ **Q1. Which yarn brands and types in the initial catalog?**
_Answer: Istex Léttlopi only._

✅ **Q2. How many Léttlopi colors?**
_Answer: ~20 curated colors as the starting point._

✅ **Q3. Yarn density/gauge data needed from the start?**
_Léttlopi gauge: 18 stitches / 10cm on 4.5mm needles. Hardcoded._

---

## Pattern Designer

✅ **Q4. Sleeve opening patterns shared between left and right?**
_Answer: Yes, shared/symmetric._

✅ **Q5a. Yoke grid structure?**
_Answer: 12 cols wide (fixed repeating motif) × 56 rows tall (fixed = full yoke height)._
_The motif tiles horizontally around the sweater. Body circumference must be a multiple of 12_
_so the repeat fits evenly. Yoke narrows via column-skipping (predefined schedule)._

✅ **Q5b. Who defines which yoke rows are skipped per size?**
_Answer: Predefined in code. Will be specified in a dedicated user story._

✅ **Q5c. Column width for yoke?**
_Answer: Always 12 columns fixed. The 12–24 range from the README is dropped._

✅ **Q6. Drawing tools?**
_Answer: Freehand (drag to paint), Line tool (start/end cells, Bresenham), Fill entire pattern button (with confirmation)._

✅ **Q7. Undo/redo?**
_Not required for first version._

---

## Sweater Preview

✅ **Q8. Sizes S to 4XL confirmed.**
_Stitch counts: S=160 → 4XL=232 (increments of +12). Before yoke: +8 each → 168–240 (multiples of 12)._

✅ **Q9. Visual style of preview?**
_Answer: Flat 2D, front view only. Simple filled shapes. 3D later._

✅ **Q10. Front view only?**
_Answer: Yes._

✅ **Q11. Yoke taper shape in the 2D preview?**
_Answer: Stepped trapezoid — width changes at each column-skip threshold row._

✅ **Q12 (new). Sleeve opening pattern location?**
_Confirmed from README: sleeve structure top-to-bottom = solid body → pattern → ribbing (5cm)._
_Pattern sits directly above the wrist ribbing._

---

## Instructions Download

✅ **Q13. Format?**
_Answer: Plain text (.txt)._

✅ **Q14. Instructions content?**
_Answer: To be defined when writing the instructions user story._

---

## General UX

✅ **Q15. Export/import?**
_Answer: Yes — user can export/import design as JSON file. No backend needed._
_Import replaces the current project with a confirmation prompt._

✅ **Q16. Multiple projects?**
_Answer: No — single active project, auto-saved to localStorage._
