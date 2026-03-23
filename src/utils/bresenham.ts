/** Returns all grid cells on the line from (r0,c0) to (r1,c1) using Bresenham's algorithm. */
export function bresenhamLine(
  r0: number, c0: number,
  r1: number, c1: number,
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  let dr = Math.abs(r1 - r0)
  let dc = Math.abs(c1 - c0)
  const sr = r0 < r1 ? 1 : -1
  const sc = c0 < c1 ? 1 : -1
  let err = dr - dc
  let r = r0, c = c0

  while (true) {
    cells.push({ row: r, col: c })
    if (r === r1 && c === c1) break
    const e2 = 2 * err
    if (e2 > -dc) { err -= dc; r += sr }
    if (e2 <  dr) { err += dr; c += sc }
  }

  return cells
}
