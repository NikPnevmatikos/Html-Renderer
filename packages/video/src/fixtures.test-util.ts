import type { RenderElement, RenderNode } from '@nikpnevmatikos/html-renderer';

// Hand-built render-tree fixtures, typed against the core package so any
// structural drift fails typecheck. The parse→attribs shape itself (value-less
// boolean attrs as '', <source> children, etc.) is pinned by core's own
// build.test.ts; core's dist is ESM and can't be require()d by node jest.
export function el(
  tag: string,
  attribs: Record<string, string> = {},
  children: RenderNode[] = [],
): RenderElement {
  return { kind: 'element', tag, display: 'block', style: {}, attribs, children };
}

export function text(t: string): RenderNode {
  return { kind: 'text', text: t, style: {} };
}
