import { buildRenderTree, treeContainsTag } from './build';
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

  it('applies tagsStyles over tag defaults', () => {
    const tree = buildRenderTree(parseHtml('<h1>x</h1>'), {
      tagsStyles: { h1: { color: 'purple', fontSize: 40 } },
    });
    const h1 = tree[0] as RenderElement;
    expect(h1.style.color).toBe('purple');
    expect(h1.style.fontSize).toBe(40);
  });

  it('accepts tagsStyles as CSS string', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      tagsStyles: { p: 'color: green; font-size: 18px' },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('green');
    expect(p.style.fontSize).toBe(18);
  });

  it('applies display:none via classesStyles', () => {
    const tree = buildRenderTree(
      parseHtml('<div class="hide">hidden</div>'),
      { classesStyles: { hide: { display: 'none' } } },
    );
    const div = tree[0] as RenderElement;
    expect(div.style.display).toBe('none');
  });

  it('parses display from CSS string', () => {
    const tree = buildRenderTree(parseHtml('<div style="display: none">x</div>'));
    const div = tree[0] as RenderElement;
    expect(div.style.display).toBe('none');
  });

  it('applies classesStyles to matching class', () => {
    const tree = buildRenderTree(
      parseHtml('<p class="warn">x</p>'),
      { classesStyles: { warn: { color: 'orange' } } },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('orange');
  });

  it('applies classesStyles for multiple classes in source order', () => {
    const tree = buildRenderTree(
      parseHtml('<p class="a b">x</p>'),
      {
        classesStyles: {
          a: { color: 'red' },
          b: { color: 'blue' },
        },
      },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('blue');
  });

  it('applies idsStyles to matching id', () => {
    const tree = buildRenderTree(
      parseHtml('<p id="hero">x</p>'),
      { idsStyles: { hero: { color: 'red', fontSize: 30 } } },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('red');
    expect(p.style.fontSize).toBe(30);
  });

  it('respects cascade order: inline > id > class > tag', () => {
    const tree = buildRenderTree(
      parseHtml(
        '<p class="c" id="i" style="color: inline-win">x</p>',
      ),
      {
        tagsStyles: { p: { color: 'tag' } },
        classesStyles: { c: { color: 'class' } },
        idsStyles: { i: { color: 'id' } },
      },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('inline-win');
  });

  it('id beats class when no inline style', () => {
    const tree = buildRenderTree(parseHtml('<p class="c" id="i">x</p>'), {
      classesStyles: { c: { color: 'class' } },
      idsStyles: { i: { color: 'id' } },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('id');
  });

  it('ignoredDomTags drops tag and its subtree', () => {
    const tree = buildRenderTree(
      parseHtml('<div>keep<iframe>drop this</iframe>keep</div>'),
      { ignoredDomTags: ['iframe'] },
    );
    const div = tree[0] as RenderElement;
    expect(div.children).toHaveLength(2);
    expect((div.children[0] as { text: string }).text).toBe('keep');
    expect((div.children[1] as { text: string }).text).toBe('keep');
  });

  it('ignoredDomTags is case-insensitive', () => {
    const tree = buildRenderTree(parseHtml('<IFRAME>drop</IFRAME>'), {
      ignoredDomTags: ['iframe'],
    });
    expect(tree).toHaveLength(0);
  });

  it('ignoredStyles drops CSS-name properties after cascade', () => {
    const tree = buildRenderTree(
      parseHtml('<p style="color: red; font-size: 20px">x</p>'),
      { ignoredStyles: ['color'] },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBeUndefined();
    expect(p.style.fontSize).toBe(20);
  });

  it('ignoredStyles accepts RN camelCase too', () => {
    const tree = buildRenderTree(
      parseHtml('<p style="background-color: yellow">x</p>'),
      { ignoredStyles: ['backgroundColor'] },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.backgroundColor).toBeUndefined();
  });

  it('ol respects HTML start attribute', () => {
    const tree = buildRenderTree(
      parseHtml('<ol start="5"><li>a</li><li>b</li></ol>'),
    );
    const ol = tree[0] as RenderElement;
    expect((ol.children[0] as RenderElement).listMarker).toBe('5. ');
    expect((ol.children[1] as RenderElement).listMarker).toBe('6. ');
  });

  it('ol respects renderersProps.ol.startIndex when no start attr', () => {
    const tree = buildRenderTree(
      parseHtml('<ol><li>a</li><li>b</li></ol>'),
      { renderersProps: { ol: { startIndex: 10 } } },
    );
    const ol = tree[0] as RenderElement;
    expect((ol.children[0] as RenderElement).listMarker).toBe('10. ');
  });

  it('HTML start attribute wins over renderersProps.ol.startIndex', () => {
    const tree = buildRenderTree(
      parseHtml('<ol start="3"><li>a</li></ol>'),
      { renderersProps: { ol: { startIndex: 10 } } },
    );
    const ol = tree[0] as RenderElement;
    expect((ol.children[0] as RenderElement).listMarker).toBe('3. ');
  });

  it('li tracks listOrdered flag', () => {
    const ulTree = buildRenderTree(parseHtml('<ul><li>a</li></ul>'));
    const ulLi = (ulTree[0] as RenderElement).children[0] as RenderElement;
    expect(ulLi.listOrdered).toBe(false);

    const olTree = buildRenderTree(parseHtml('<ol><li>a</li></ol>'));
    const olLi = (olTree[0] as RenderElement).children[0] as RenderElement;
    expect(olLi.listOrdered).toBe(true);
  });

  it('customHTMLElementModels defines new block tag', () => {
    const tree = buildRenderTree(
      parseHtml('<my-card>hello</my-card>'),
      {
        customHTMLElementModels: {
          'my-card': {
            display: 'block',
            tagDefaultStyle: { padding: 12, backgroundColor: '#eef' },
          },
        },
      },
    );
    const card = tree[0] as RenderElement;
    expect(card.tag).toBe('my-card');
    expect(card.display).toBe('block');
    expect(card.style.padding).toBe(12);
    expect(card.style.backgroundColor).toBe('#eef');
  });

  it('customHTMLElementModels isVoid drops children', () => {
    const tree = buildRenderTree(
      parseHtml('<x-spacer>ignored</x-spacer>'),
      {
        customHTMLElementModels: {
          'x-spacer': { display: 'block', isVoid: true },
        },
      },
    );
    const spacer = tree[0] as RenderElement;
    expect(spacer.children).toHaveLength(0);
  });

  it('stylesheet applies type selector', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      stylesheet: 'p { color: red; font-size: 20px }',
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('red');
    expect(p.style.fontSize).toBe(20);
  });

  it('stylesheet class selector matches by class attr', () => {
    const tree = buildRenderTree(parseHtml('<p class="foo">x</p>'), {
      stylesheet: '.foo { color: blue }',
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('blue');
  });

  it('stylesheet id beats class by specificity', () => {
    const tree = buildRenderTree(
      parseHtml('<p class="c" id="i">x</p>'),
      { stylesheet: '.c { color: class } #i { color: id }' },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('id');
  });

  it('stylesheet source order breaks specificity ties', () => {
    const tree = buildRenderTree(
      parseHtml('<p class="a b">x</p>'),
      { stylesheet: '.a { color: first } .b { color: second }' },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('second');
  });

  it('stylesheet descendant selector walks ancestor chain', () => {
    const tree = buildRenderTree(
      parseHtml('<article><h1><span>x</span></h1></article>'),
      { stylesheet: 'article span { color: nested }' },
    );
    const article = tree[0] as RenderElement;
    const h1 = article.children[0] as RenderElement;
    const span = h1.children[0] as RenderElement;
    expect(span.style.color).toBe('nested');
  });

  it('stylesheet child selector requires immediate parent', () => {
    const tree = buildRenderTree(
      parseHtml('<div><span>close</span><p><span>far</span></p></div>'),
      { stylesheet: 'div > span { color: direct }' },
    );
    const div = tree[0] as RenderElement;
    const closeSpan = div.children[0] as RenderElement;
    const p = div.children[1] as RenderElement;
    const farSpan = p.children[0] as RenderElement;
    expect(closeSpan.style.color).toBe('direct');
    expect(farSpan.style.color).not.toBe('direct');
  });

  it('programmatic tagsStyles beats stylesheet type selector', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      stylesheet: 'p { color: from-stylesheet }',
      tagsStyles: { p: { color: 'from-tags-styles' } },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('from-tags-styles');
  });

  it('inline style wins over stylesheet', () => {
    const tree = buildRenderTree(
      parseHtml('<p style="color: inline">x</p>'),
      { stylesheet: 'p { color: from-stylesheet }' },
    );
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('inline');
  });

  it('customHTMLElementModels can override existing tag display', () => {
    const tree = buildRenderTree(parseHtml('<div>x</div>'), {
      customHTMLElementModels: { div: { display: 'inline' } },
    });
    const div = tree[0] as RenderElement;
    expect(div.display).toBe('inline');
  });

  it('ignoredStyles works on tag defaults too', () => {
    const tree = buildRenderTree(parseHtml('<h1>x</h1>'), {
      ignoredStyles: ['font-weight'],
    });
    const h1 = tree[0] as RenderElement;
    expect(h1.style.fontWeight).toBeUndefined();
    expect(h1.style.fontSize).toBe(32);
  });

  it('stores attribs on <a> for onLinkPress consumers', () => {
    const tree = buildRenderTree(
      parseHtml('<a href="/x" target="_blank" data-track="home">x</a>'),
    );
    const a = tree[0] as RenderElement;
    expect(a.attribs).toMatchObject({
      href: '/x',
      target: '_blank',
      'data-track': 'home',
    });
  });
});

describe('tagsStyles.body as document root style', () => {
  it('inherits body color into fragment content without a <body> element', () => {
    const tree = buildRenderTree(parseHtml('<p>hello</p>'), {
      tagsStyles: { body: { color: 'white' } },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('white');
    expect((p.children[0] as RenderText).style.color).toBe('white');
  });

  it('body inherits into bare top-level text nodes', () => {
    const tree = buildRenderTree(parseHtml('just text'), {
      tagsStyles: { body: { color: 'white' } },
    });
    const t = tree[0] as RenderText;
    expect(t.style.color).toBe('white');
  });

  it('tagsStyles.body overrides baseStyle at the root', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      baseStyle: { color: 'red' },
      tagsStyles: { body: { color: 'white' } },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('white');
  });

  it('body box props do not leak into top-level elements', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      tagsStyles: {
        body: { color: 'white', padding: 16, backgroundColor: 'blue' },
      },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('white');
    expect(p.style.padding).toBeUndefined();
    expect(p.style.backgroundColor).toBeUndefined();
  });

  it('baseStyle box props do not leak into top-level elements', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      baseStyle: { color: 'red', padding: 16 },
    });
    const p = tree[0] as RenderElement;
    expect(p.style.color).toBe('red');
    expect(p.style.padding).toBeUndefined();
  });

  it('tag defaults still beat the inherited body color', () => {
    const tree = buildRenderTree(parseHtml('<p><a href="/x">link</a></p>'), {
      tagsStyles: { body: { color: 'white' } },
    });
    const p = tree[0] as RenderElement;
    const a = p.children[0] as RenderElement;
    expect(p.style.color).toBe('white');
    expect(a.style.color).toBe('#1a73e8');
  });

  it('element-level styles still beat the inherited body color', () => {
    const tree = buildRenderTree(
      parseHtml('<p class="warn">x</p><p style="color: inline">y</p>'),
      {
        tagsStyles: { body: { color: 'white' } },
        classesStyles: { warn: { color: 'orange' } },
      },
    );
    expect((tree[0] as RenderElement).style.color).toBe('orange');
    expect((tree[1] as RenderElement).style.color).toBe('inline');
  });

  it('accepts tagsStyles.body as a CSS string', () => {
    const tree = buildRenderTree(parseHtml('<p>x</p>'), {
      tagsStyles: { body: 'color: white' },
    });
    expect((tree[0] as RenderElement).style.color).toBe('white');
  });
});

describe('full-document HTML', () => {
  it('renders a literal <body> as a block that matches tagsStyles.body', () => {
    const tree = buildRenderTree(parseHtml('<body><p>x</p></body>'), {
      tagsStyles: { body: { color: 'white', padding: 16 } },
    });
    const body = tree[0] as RenderElement;
    expect(body.tag).toBe('body');
    expect(body.display).toBe('block');
    expect(body.style.color).toBe('white');
    expect(body.style.padding).toBe(16);
    const p = body.children[0] as RenderElement;
    expect(p.style.color).toBe('white');
    expect(p.style.padding).toBeUndefined();
  });

  it('inline style on a literal <body> wins over tagsStyles.body', () => {
    const tree = buildRenderTree(
      parseHtml('<body style="color: teal; padding: 4px"><p>x</p></body>'),
      { tagsStyles: { body: { color: 'white', padding: 16 } } },
    );
    const body = tree[0] as RenderElement;
    expect(body.style.color).toBe('teal');
    // Inline CSS padding shorthand expands to per-side values, which RN
    // resolves over the object-form `padding` from tagsStyles.
    expect(body.style.paddingTop).toBe(4);
    expect(body.style.paddingLeft).toBe(4);
  });

  it('drops head/title/style/script by default and keeps content', () => {
    const tree = buildRenderTree(
      parseHtml(
        '<html><head><title>T</title><style>p{color:red}</style>' +
          '<script>var x=1</script></head><body><p>hello</p></body></html>',
      ),
    );
    expect(tree).toHaveLength(1);
    const htmlEl = tree[0] as RenderElement;
    expect(htmlEl.tag).toBe('html');
    expect(htmlEl.display).toBe('block');
    const body = htmlEl.children[0] as RenderElement;
    expect(body.tag).toBe('body');
    const p = body.children[0] as RenderElement;
    expect((p.children[0] as RenderText).text).toBe('hello');
  });

  it('drops stray style/script/meta outside head too', () => {
    const tree = buildRenderTree(
      parseHtml('<style>p{color:red}</style><meta charset="utf-8"><p>x</p>'),
    );
    expect(tree).toHaveLength(1);
    expect((tree[0] as RenderElement).tag).toBe('p');
  });

  it('merges user ignoredDomTags with the defaults', () => {
    const tree = buildRenderTree(
      parseHtml('<title>T</title><iframe>drop</iframe><p>x</p>'),
      { ignoredDomTags: ['iframe'] },
    );
    expect(tree).toHaveLength(1);
    expect((tree[0] as RenderElement).tag).toBe('p');
  });

  it('treeContainsTag finds a nested body and rejects absent tags', () => {
    const doc = buildRenderTree(parseHtml('<html><body><p>x</p></body></html>'));
    expect(treeContainsTag(doc, 'body')).toBe(true);
    const fragment = buildRenderTree(parseHtml('<p>x</p>'));
    expect(treeContainsTag(fragment, 'body')).toBe(false);
  });
});
