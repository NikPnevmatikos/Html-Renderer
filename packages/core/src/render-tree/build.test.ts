import { buildRenderTree } from './build';
import { parseHtml } from '../parser/parse';
import type { RenderElement, RenderText, RenderImage } from '../types';

function build(html: string) {
  return buildRenderTree(parseHtml(html));
}

describe('buildRenderTree', () => {
  it('builds a simple paragraph', () => {
    const tree = build('<p>hello</p>');
    expect(tree).toHaveLength(1);
    const p = tree[0] as RenderElement;
    expect(p).toMatchObject({ kind: 'element', tag: 'p', display: 'block' });
    expect((p.children[0] as RenderText).text).toBe('hello');
  });

  it('marks h1 as block with default heading style', () => {
    const tree = build('<h1>hi</h1>');
    const h1 = tree[0] as RenderElement;
    expect(h1.display).toBe('block');
    expect(h1.style.fontWeight).toBe('bold');
    expect(h1.style.fontSize).toBe(32);
  });

  it('marks strong/em as inline with proper defaults', () => {
    const tree = build('<p><strong>bold</strong> <em>italic</em></p>');
    const p = tree[0] as RenderElement;
    const strong = p.children[0] as RenderElement;
    const em = p.children[2] as RenderElement;
    expect(strong.display).toBe('inline');
    expect(strong.style.fontWeight).toBe('bold');
    expect(em.style.fontStyle).toBe('italic');
  });

  it('parses images with explicit dimensions', () => {
    const tree = build('<img src="x.jpg" width="200" height="100" alt="hi">');
    expect(tree[0]).toMatchObject<Partial<RenderImage>>({
      kind: 'image',
      src: 'x.jpg',
      width: 200,
      height: 100,
      alt: 'hi',
    });
  });

  it('drops img without src', () => {
    const tree = build('<img alt="no src">');
    expect(tree).toHaveLength(0);
  });

  it('inherits color and fontSize down', () => {
    const tree = build('<p style="color: red; font-size: 20px">hi <strong>there</strong></p>');
    const p = tree[0] as RenderElement;
    const strong = p.children[1] as RenderElement;
    expect(strong.style.color).toBe('red');
    expect(strong.style.fontSize).toBe(20);
    expect(strong.style.fontWeight).toBe('bold');
  });

  it('child inline styles override inherited values', () => {
    const tree = build(
      '<p style="color: red"><span style="color: blue">x</span></p>',
    );
    const p = tree[0] as RenderElement;
    const span = p.children[0] as RenderElement;
    expect(span.style.color).toBe('blue');
  });

  it('marks br inline with preserved \\n', () => {
    const tree = build('<p>a<br/>b</p>');
    const p = tree[0] as RenderElement;
    const br = p.children[1] as RenderElement;
    expect(br.tag).toBe('br');
    expect(br.display).toBe('inline');
    expect((br.children[0] as RenderText).preserveWhitespace).toBe(true);
  });

  it('preserves whitespace inside <pre>', () => {
    const tree = build('<pre>  spaces\n  kept\n</pre>');
    const pre = tree[0] as RenderElement;
    const t = pre.children[0] as RenderText;
    expect(t.preserveWhitespace).toBe(true);
    expect(t.text).toContain('  spaces\n  kept');
  });

  it('assigns list markers on ul and ol', () => {
    const ulTree = build('<ul><li>a</li><li>b</li></ul>');
    const ul = ulTree[0] as RenderElement;
    const li1 = ul.children[0] as RenderElement;
    const li2 = ul.children[1] as RenderElement;
    expect(li1.listMarker).toBe('\u2022  ');
    expect(li2.listMarker).toBe('\u2022  ');

    const olTree = build('<ol><li>a</li><li>b</li></ol>');
    const ol = olTree[0] as RenderElement;
    expect((ol.children[0] as RenderElement).listMarker).toBe('1. ');
    expect((ol.children[1] as RenderElement).listMarker).toBe('2. ');
  });

  it('hoists block out of inline', () => {
    const tree = build('<strong>a<div>b</div>c</strong>');
    expect(tree).toHaveLength(3);
    expect(tree[0]).toMatchObject({ tag: 'strong' });
    expect(tree[1]).toMatchObject({ tag: 'div' });
    expect(tree[2]).toMatchObject({ tag: 'strong' });
  });

  it('parses colspan on td/th', () => {
    const tree = build('<table><tr><td colspan="2">a</td></tr></table>');
    const table = tree[0] as RenderElement;
    const tr = table.children[0] as RenderElement;
    const td = tr.children[0] as RenderElement;
    expect(td.colSpan).toBe(2);
  });

  it('collapses whitespace as part of the pipeline', () => {
    const tree = build('<p>  hello   world  </p>');
    const p = tree[0] as RenderElement;
    expect((p.children[0] as RenderText).text).toBe('hello world');
  });

  it('accepts baseStyle override', () => {
    const tree = buildRenderTree(parseHtml('<p>hi</p>'), {
      baseStyle: { color: '#123456' },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('#123456');
  });
});
