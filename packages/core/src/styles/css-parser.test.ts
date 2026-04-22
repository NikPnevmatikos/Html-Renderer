import { parseStylesheet } from './css-parser';

describe('parseStylesheet', () => {
  it('parses a single rule with a type selector', () => {
    const rules = parseStylesheet('h1 { color: red; }');
    expect(rules).toHaveLength(1);
    expect(rules[0]!.selectors[0]!.parts).toEqual([
      { combinator: 'root', tag: 'h1', classes: [], ids: [] },
    ]);
    expect(rules[0]!.declarations).toEqual({ color: 'red' });
  });

  it('parses multiple rules with source order', () => {
    const rules = parseStylesheet('h1 { color: red } p { color: blue }');
    expect(rules).toHaveLength(2);
    expect(rules[0]!.sourceOrder).toBe(0);
    expect(rules[1]!.sourceOrder).toBe(1);
  });

  it('parses class and id selectors', () => {
    const rules = parseStylesheet('.foo { color: red } #bar { color: blue }');
    expect(rules[0]!.selectors[0]!.parts[0]).toMatchObject({
      tag: null,
      classes: ['foo'],
      ids: [],
    });
    expect(rules[1]!.selectors[0]!.parts[0]).toMatchObject({
      tag: null,
      classes: [],
      ids: ['bar'],
    });
  });

  it('parses compound selectors', () => {
    const rules = parseStylesheet('h1.big#hero { color: red }');
    const part = rules[0]!.selectors[0]!.parts[0]!;
    expect(part.tag).toBe('h1');
    expect(part.classes).toEqual(['big']);
    expect(part.ids).toEqual(['hero']);
  });

  it('parses descendant selectors', () => {
    const rules = parseStylesheet('h1 span { color: red }');
    const parts = rules[0]!.selectors[0]!.parts;
    expect(parts).toHaveLength(2);
    expect(parts[0]!.combinator).toBe('root');
    expect(parts[0]!.tag).toBe('h1');
    expect(parts[1]!.combinator).toBe('descendant');
    expect(parts[1]!.tag).toBe('span');
  });

  it('parses child combinators', () => {
    const rules = parseStylesheet('h1 > span { color: red }');
    const parts = rules[0]!.selectors[0]!.parts;
    expect(parts[1]!.combinator).toBe('child');
  });

  it('parses selector lists (comma-separated)', () => {
    const rules = parseStylesheet('h1, h2 { color: red }');
    expect(rules[0]!.selectors).toHaveLength(2);
    expect(rules[0]!.selectors[0]!.parts[0]!.tag).toBe('h1');
    expect(rules[0]!.selectors[1]!.parts[0]!.tag).toBe('h2');
  });

  it('computes specificity correctly', () => {
    const rules = parseStylesheet(`
      h1 { color: a }
      .foo { color: b }
      #bar { color: c }
      h1.foo#bar { color: d }
    `);
    expect(rules[0]!.selectors[0]!.specificity).toBe(1);
    expect(rules[1]!.selectors[0]!.specificity).toBe(100);
    expect(rules[2]!.selectors[0]!.specificity).toBe(10000);
    expect(rules[3]!.selectors[0]!.specificity).toBe(10101);
  });

  it('strips comments', () => {
    const rules = parseStylesheet('/* comment */ h1 { color: red } /* another */');
    expect(rules).toHaveLength(1);
    expect(rules[0]!.selectors[0]!.parts[0]!.tag).toBe('h1');
  });

  it('handles universal selector', () => {
    const rules = parseStylesheet('* { color: red }');
    expect(rules[0]!.selectors[0]!.parts[0]!.tag).toBeNull();
  });
});
