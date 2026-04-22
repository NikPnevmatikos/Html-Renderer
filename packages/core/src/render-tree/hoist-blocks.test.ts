import { hoistBlocks } from './hoist-blocks';
import type {
  RenderNode,
  RenderElement,
  RenderText,
  RenderImage,
} from '../types';

function text(t: string): RenderText {
  return { kind: 'text', text: t, style: {} };
}

function block(tag: string, children: RenderNode[]): RenderElement {
  return { kind: 'element', tag, display: 'block', style: {}, children };
}

function inline(tag: string, children: RenderNode[]): RenderElement {
  return { kind: 'element', tag, display: 'inline', style: {}, children };
}

function image(src: string): RenderImage {
  return { kind: 'image', src };
}

describe('hoistBlocks', () => {
  it('leaves a tree with no block-in-inline unchanged', () => {
    const tree: RenderNode[] = [block('p', [text('hello')])];
    const out = hoistBlocks(tree);
    expect(out).toEqual(tree);
  });

  it('fragments an inline wrapping a block into [inline, block, inline]', () => {
    const tree: RenderNode[] = [
      inline('strong', [text('before '), block('div', [text('mid')]), text(' after')]),
    ];
    const out = hoistBlocks(tree);
    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ kind: 'element', tag: 'strong', display: 'inline' });
    expect(out[1]).toMatchObject({ kind: 'element', tag: 'div', display: 'block' });
    expect(out[2]).toMatchObject({ kind: 'element', tag: 'strong', display: 'inline' });
    expect(((out[0] as RenderElement).children[0] as RenderText).text).toBe('before ');
    expect(((out[2] as RenderElement).children[0] as RenderText).text).toBe(' after');
  });

  it('handles inline containing image by fragmenting', () => {
    const tree: RenderNode[] = [
      inline('span', [text('x '), image('http://y'), text(' z')]),
    ];
    const out = hoistBlocks(tree);
    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ tag: 'span' });
    expect(out[1]).toMatchObject({ kind: 'image' });
    expect(out[2]).toMatchObject({ tag: 'span' });
  });

  it('handles nested inline containing block (bottom-up)', () => {
    const tree: RenderNode[] = [
      inline('a', [
        inline('strong', [text('a '), block('div', [text('b')]), text(' c')]),
      ]),
    ];
    const out = hoistBlocks(tree);
    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ tag: 'a' });
    expect(out[1]).toMatchObject({ tag: 'div' });
    expect(out[2]).toMatchObject({ tag: 'a' });
  });

  it('drops empty inline fragments', () => {
    const tree: RenderNode[] = [
      inline('strong', [block('div', [text('only')])]),
    ];
    const out = hoistBlocks(tree);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ tag: 'div' });
  });

  it('recurses into block children too', () => {
    const tree: RenderNode[] = [
      block('p', [
        inline('strong', [text('a '), block('div', [text('b')]), text(' c')]),
      ]),
    ];
    const out = hoistBlocks(tree);
    const p = out[0] as RenderElement;
    expect(p.children).toHaveLength(3);
    expect(p.children[1]).toMatchObject({ tag: 'div' });
  });
});
