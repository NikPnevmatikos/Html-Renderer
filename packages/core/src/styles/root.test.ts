import { resolveRootStyle, ROOT_DEFAULT_STYLE } from './root';

describe('resolveRootStyle', () => {
  it('returns defaults when no options given', () => {
    expect(resolveRootStyle({})).toEqual(ROOT_DEFAULT_STYLE);
  });

  it('merges baseStyle over defaults', () => {
    const style = resolveRootStyle({ baseStyle: { color: 'red', padding: 8 } });
    expect(style.color).toBe('red');
    expect(style.padding).toBe(8);
    expect(style.fontSize).toBe(ROOT_DEFAULT_STYLE.fontSize);
  });

  it('tagsStyles.body wins over baseStyle', () => {
    const style = resolveRootStyle({
      baseStyle: { color: 'red', fontSize: 20 },
      tagsStyles: { body: { color: 'white' } },
    });
    expect(style.color).toBe('white');
    expect(style.fontSize).toBe(20);
  });

  it('accepts tagsStyles.body as a CSS string', () => {
    const style = resolveRootStyle({
      tagsStyles: { body: 'color: white; padding: 16px' },
    });
    expect(style.color).toBe('white');
    // The CSS shorthand expands to per-side values.
    expect(style.paddingTop).toBe(16);
    expect(style.paddingBottom).toBe(16);
  });

  it('ignores other tagsStyles entries', () => {
    const style = resolveRootStyle({
      tagsStyles: { p: { color: 'green' }, html: { color: 'blue' } },
    });
    expect(style.color).toBe(ROOT_DEFAULT_STYLE.color);
  });
});
