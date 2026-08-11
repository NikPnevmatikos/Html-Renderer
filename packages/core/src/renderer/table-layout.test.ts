import { resolveRowCellFlex } from './table-layout';

describe('resolveRowCellFlex', () => {
  it('keeps equal flexible columns when no cell has a width', () => {
    expect(resolveRowCellFlex([{}, {}, {}])).toEqual([
      { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    ]);
  });

  it('weights widthless columns by colSpan', () => {
    expect(resolveRowCellFlex([{ colSpan: 2 }, {}])).toEqual([
      { flexGrow: 2, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    ]);
  });

  it('shares the row proportionally when every cell has a percent width', () => {
    expect(
      resolveRowCellFlex([
        { width: '15%' },
        { width: '33.0621%' },
        { width: '15%' },
      ]),
    ).toEqual([
      { flexGrow: 15, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 33.0621, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 15, flexShrink: 1, flexBasis: 0 },
    ]);
  });

  it('pins sized cells and lets the rest share the remainder', () => {
    expect(
      resolveRowCellFlex([{ width: '50%' }, {}, { width: 120 }]),
    ).toEqual([
      { flexGrow: 0, flexShrink: 1, flexBasis: '50%' },
      { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 120 },
    ]);
  });

  it('treats a non-positive percent as a pinned width, not a proportion', () => {
    expect(resolveRowCellFlex([{ width: '0%' }, { width: '100%' }])).toEqual([
      { flexGrow: 0, flexShrink: 1, flexBasis: '0%' },
      { flexGrow: 0, flexShrink: 1, flexBasis: '100%' },
    ]);
  });

  it('returns empty for an empty row', () => {
    expect(resolveRowCellFlex([])).toEqual([]);
  });
});
