import { parseHtml } from './parse';

describe('parseHtml', () => {
  it('parses a simple element with text', () => {
    const dom = parseHtml('<p>hello</p>');
    expect(dom).toHaveLength(1);
    expect(dom[0]).toMatchObject({
      type: 'element',
      name: 'p',
      children: [{ type: 'text', data: 'hello' }],
    });
  });

  it('lowercases tag names', () => {
    const dom = parseHtml('<DIV>x</DIV>');
    expect(dom[0]).toMatchObject({ type: 'element', name: 'div' });
  });

  it('preserves attribs', () => {
    const dom = parseHtml('<a href="https://x.com" title="t">x</a>');
    expect(dom[0]).toMatchObject({
      type: 'element',
      name: 'a',
      attribs: { href: 'https://x.com', title: 't' },
    });
  });

  it('decodes entities', () => {
    const dom = parseHtml('<p>&amp; &lt; &gt;</p>');
    const p = dom[0] as { children: Array<{ data: string }> };
    expect(p.children[0]!.data).toBe('& < >');
  });

  it('nests children correctly', () => {
    const dom = parseHtml('<p>one <strong>two</strong> three</p>');
    const p = dom[0] as { children: unknown[] };
    expect(p.children).toHaveLength(3);
  });

  it('handles multiple root elements', () => {
    const dom = parseHtml('<p>a</p><p>b</p>');
    expect(dom).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(parseHtml('')).toEqual([]);
  });

  it('skips script nodes (not type="tag")', () => {
    const dom = parseHtml('<p>keep</p><script>evil()</script>');
    expect(dom).toHaveLength(1);
    expect(dom[0]).toMatchObject({ name: 'p' });
  });
});
