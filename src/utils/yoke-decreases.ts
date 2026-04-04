import type { DecreaseEntry } from '../types'

/**
 * Returns the set of "row,col" keys (both 1-indexed) that are inactive
 * due to user-defined decreases. Each entry makes its column inactive
 * from fromRow up to totalRows (inclusive).
 */
export function deriveInactiveCells(
  schedule: DecreaseEntry[],
  totalRows = 56,
): Set<string> {
  const result = new Set<string>()
  for (const { col, fromRow } of schedule) {
    for (let row = fromRow; row <= totalRows; row++) {
      result.add(`${row},${col}`)
    }
  }
  return result
}
