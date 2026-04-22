import { collapseWhitespace } from './whitespace';
import type { RenderNode, RenderText, RenderElement } from '../types';

function text(t: string, preserve = false): RenderText {
  const n: RenderText = { kind: 'text', text: t, style: {} };
  if (preserve) n.preserveWhitespace = true;
  return n;
}

function block(tag: string, children: RenderNode[]): RenderElement {
  return { kind: 'element', tag, display: 'block', style: {}, children };
}

function inline(tag: string, children: RenderNode[]): RenderElement {
  return { kind: 'element', tag, display: 'inline', style: {}, children };
}

describe('collapseWhitespace', () => {
  it('collapses internal runs of whitespace to a single space', () => {
    const out = collapseWhitespace([text('hello     world')]);
    expect((out[0] as RenderText).text).toBe('hello world');
  });

  it('converts newlines and tabs to spaces', () => {
    const out = collapseWhitespace([text('hello\n\tworld')]);
    expect((out[0] as RenderText).text).toBe('hello world');
  });

  it('trims leading whitespace at block boundary', () => {
    const out = collapseWhitespace([text('   hello')]);
    expect((out[0] as RenderText).text).toBe('hello');
  });

  it('trims trailing whitespace at block boundary', () => {
    const out = collapseWhitespace([text('hello   ')]);
    expect((out[0] as RenderText).text).toBe('hello');
  });

  it('preserves whitespace when preserveWhitespace is set', () => {
    const out = collapseWhitespace([text('   keep   me   ', true)]);
    expect((out[0] as RenderText).text).toBe('   keep   me   ');
  });

  it('handles cross-leaf adjacent whitespace', () => {
    const out = collapseWhitespace([
      text('foo '),
      inline('strong', [text(' bar ')]),
      text(' baz'),
    ]);
    const leaves: string[] = [];
    const walk = (nodes: RenderNode[]): void => {
      for (const n of nodes) {
        if (n.kind === 'text') leaves.push(n.text);
        else if (n.kind === 'element') walk(n.children);
      }
    };
    walk(out);
    expect(leaves.join('')).toBe('foo bar baz');
  });

  it('drops whitespace-only text nodes between blocks', () => {
    const out = collapseWhitespace([
      block('p', [text('one')]),
      text('  \n  '),
      block('p', [text('two')]),
    ]);
    expect(out).toHaveLength(2);
    expect((out[0] as RenderElement).tag).toBe('p');
    expect((out[1] as RenderElement).tag).toBe('p');
  });

  it('recurses into block children', () => {
    const out = collapseWhitespace([
      block('p', [text('  hello   world  ')]),
    ]);
    const p = out[0] as RenderElement;
    expect((p.children[0] as RenderText).text).toBe('hello world');
  });
});
