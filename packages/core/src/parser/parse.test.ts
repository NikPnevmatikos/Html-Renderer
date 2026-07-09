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

  describe('entity-encoded html', () => {
    it('decodes fully encoded html and parses the tags', () => {
      const dom = parseHtml(
        '&lt;p class=&quot;a&quot;&gt;hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;',
      );
      expect(dom).toHaveLength(1);
      expect(dom[0]).toMatchObject({
        type: 'element',
        name: 'p',
        attribs: { class: 'a' },
      });
      const p = dom[0] as { children: Array<Record<string, unknown>> };
      expect(p.children[0]).toMatchObject({ type: 'text', data: 'hello ' });
      expect(p.children[1]).toMatchObject({ type: 'element', name: 'strong' });
    });

    it('decodes double-encoded html', () => {
      const dom = parseHtml('&amp;lt;p&amp;gt;x&amp;lt;/p&amp;gt;');
      expect(dom[0]).toMatchObject({
        type: 'element',
        name: 'p',
        children: [{ type: 'text', data: 'x' }],
      });
    });

    it('decodes numeric-entity tags', () => {
      const dom = parseHtml('&#60;p&#62;x&#60;/p&#62;');
      expect(dom[0]).toMatchObject({ type: 'element', name: 'p' });
    });

    it('decodes entities that were escaped along with the markup', () => {
      const dom = parseHtml('&lt;p&gt;Tom &amp;amp; Jerry&lt;/p&gt;');
      const p = dom[0] as { children: Array<{ data: string }> };
      expect(p.children[0]!.data).toBe('Tom & Jerry');
    });

    it('keeps raw ampersands in encoded html as text', () => {
      const dom = parseHtml('&lt;p&gt;A & B&lt;/p&gt;');
      const p = dom[0] as { children: Array<{ data: string }> };
      expect(p.children[0]!.data).toBe('A & B');
    });

    it('does not decode encoded tags when real tags are present', () => {
      const dom = parseHtml('<p>&lt;b&gt;not bold&lt;/b&gt;</p>');
      expect(dom[0]).toMatchObject({
        type: 'element',
        name: 'p',
        children: [{ type: 'text', data: '<b>not bold</b>' }],
      });
    });

    it('leaves text with encoded brackets that are not tag-shaped untouched', () => {
      const dom = parseHtml('5 &lt; 6 &gt; 4');
      expect(dom[0]).toMatchObject({ type: 'text', data: '5 < 6 > 4' });
    });
  });
});
