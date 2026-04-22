import { parseStylesheet } from './css-parser';
import { matchSelector, type ElementInfo } from './selector-match';

function sel(css: string) {
  const rules = parseStylesheet(`${css} { color: red }`);
  return rules[0]!.selectors[0]!;
}

function el(tag: string, classes: string[] = [], id: string | null = null): ElementInfo {
  return { tag, classes, id };
}

describe('matchSelector', () => {
  it('matches a type selector', () => {
    expect(matchSelector(sel('h1'), el('h1'), [])).toBe(true);
    expect(matchSelector(sel('h1'), el('h2'), [])).toBe(false);
  });

  it('matches a class selector', () => {
    expect(matchSelector(sel('.foo'), el('p', ['foo']), [])).toBe(true);
    expect(matchSelector(sel('.foo'), el('p', ['bar']), [])).toBe(false);
  });

  it('matches an id selector', () => {
    expect(matchSelector(sel('#bar'), el('p', [], 'bar'), [])).toBe(true);
    expect(matchSelector(sel('#bar'), el('p', [], 'baz'), [])).toBe(false);
  });

  it('matches compound selectors', () => {
    expect(
      matchSelector(sel('h1.big'), el('h1', ['big']), []),
    ).toBe(true);
    expect(
      matchSelector(sel('h1.big'), el('h1', ['small']), []),
    ).toBe(false);
  });

  it('matches universal selector', () => {
    expect(matchSelector(sel('*'), el('anything'), [])).toBe(true);
  });

  it('matches descendant combinator', () => {
    const target = el('span');
    const ancestors = [el('article'), el('div'), el('h1')];
    expect(matchSelector(sel('h1 span'), target, ancestors)).toBe(true);
    expect(matchSelector(sel('h2 span'), target, ancestors)).toBe(false);
  });

  it('matches deeply nested descendants', () => {
    const target = el('em');
    const ancestors = [el('article'), el('section'), el('div'), el('span')];
    expect(matchSelector(sel('article em'), target, ancestors)).toBe(true);
    expect(matchSelector(sel('section em'), target, ancestors)).toBe(true);
    expect(matchSelector(sel('main em'), target, ancestors)).toBe(false);
  });

  it('matches child combinator only for immediate parent', () => {
    const target = el('span');
    const direct = [el('h1')];
    const indirect = [el('h1'), el('div')];
    expect(matchSelector(sel('h1 > span'), target, direct)).toBe(true);
    expect(matchSelector(sel('h1 > span'), target, indirect)).toBe(false);
  });

  it('matches mixed descendant and child combinators', () => {
    const target = el('span');
    const ancestors = [el('article'), el('h1'), el('em')];
    expect(matchSelector(sel('article em > span'), target, ancestors)).toBe(
      true,
    );
  });
});
