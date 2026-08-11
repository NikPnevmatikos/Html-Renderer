export interface CellLayoutInput {
  width?: number | string;
  colSpan?: number;
}

export interface CellFlexStyle {
  flexGrow: number;
  flexShrink: number;
  flexBasis: number | string;
}

function percentValue(width: number | string | undefined): number | null {
  if (typeof width !== 'string' || !width.trim().endsWith('%')) return null;
  const n = parseFloat(width);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Flex layout for the cells of one table row.
 *
 * Cells default to equal flexible columns (weighted by colSpan), but an
 * explicit `width` on a cell must beat that default:
 * - every cell has a percent width → columns share the row in proportion to
 *   those percentages (like browsers scaling percentage columns to fill the
 *   table, e.g. 15%/33%/15% keeps the 15:33:15 ratio);
 * - otherwise cells with a width (percent or px) are pinned via flexBasis and
 *   the remaining cells share the leftover space.
 */
export function resolveRowCellFlex(cells: CellLayoutInput[]): CellFlexStyle[] {
  const percents = cells.map((c) => percentValue(c.width));
  if (cells.length > 0 && percents.every((p) => p !== null)) {
    return percents.map((p) => ({ flexGrow: p!, flexShrink: 1, flexBasis: 0 }));
  }
  return cells.map((c) =>
    c.width !== undefined
      ? { flexGrow: 0, flexShrink: 1, flexBasis: c.width }
      : { flexGrow: c.colSpan ?? 1, flexShrink: 1, flexBasis: 0 },
  );
}
