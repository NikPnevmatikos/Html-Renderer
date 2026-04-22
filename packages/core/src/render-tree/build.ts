import type {
  DomNode,
  DomElement,
  RenderNode,
  RenderElement,
  RenderImage,
  RenderText,
  ResolvedStyle,
} from '../types';
import { parseInlineStyle } from '../styles/parse-inline';
import { collapseWhitespace } from './whitespace';
import { hoistBlocks } from './hoist-blocks';

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'pre',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
]);

const INHERITED_PROPS = [
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'textDecorationLine',
  'lineHeight',
] as const;

const DEFAULT_TAG_STYLES: Record<string, ResolvedStyle> = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 19, fontWeight: 'bold' },
  h4: { fontSize: 16, fontWeight: 'bold' },
  h5: { fontSize: 13, fontWeight: 'bold' },
  h6: { fontSize: 11, fontWeight: 'bold' },
  strong: { fontWeight: 'bold' },
  b: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  a: { color: '#1a73e8', textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through' },
  strike: { textDecorationLine: 'line-through' },
  ins: { textDecorationLine: 'underline' },
  mark: { backgroundColor: '#fff3a3' },
  small: { fontSize: 12 },
  code: { fontFamily: 'monospace', backgroundColor: '#f3f3f3' },
  pre: { fontFamily: 'monospace' },
  th: { fontWeight: 'bold', textAlign: 'center' },
  caption: { fontWeight: 'bold', textAlign: 'center' },
};

const BASE_STYLE: ResolvedStyle = {
  color: '#000000',
  fontSize: 14,
};

export interface BuildOptions {
  baseStyle?: ResolvedStyle;
}

export function buildRenderTree(
  dom: DomNode[],
  options: BuildOptions = {},
): RenderNode[] {
  const rootStyle: ResolvedStyle = { ...BASE_STYLE, ...(options.baseStyle ?? {}) };
  const raw = dom
    .map((n) => buildNode(n, rootStyle, false))
    .filter((n): n is RenderNode => n !== null);
  return collapseWhitespace(hoistBlocks(raw));
}

function buildNode(
  node: DomNode,
  inherited: ResolvedStyle,
  preserveWhitespace: boolean,
): RenderNode | null {
  if (node.type === 'text') {
    if (node.data.length === 0) return null;
    const textNode: RenderText = {
      kind: 'text',
      text: node.data,
      style: pickInherited(inherited),
    };
    if (preserveWhitespace) textNode.preserveWhitespace = true;
    return textNode;
  }
  return buildElement(node, inherited, preserveWhitespace);
}

function buildElement(
  el: DomElement,
  inherited: ResolvedStyle,
  preserveWhitespace: boolean,
): RenderNode | null {
  if (el.name === 'br') {
    return {
      kind: 'element',
      tag: 'br',
      display: 'inline',
      style: pickInherited(inherited),
      children: [
        {
          kind: 'text',
          text: '\n',
          style: pickInherited(inherited),
          preserveWhitespace: true,
        },
      ],
    };
  }

  if (el.name === 'img') {
    return buildImage(el);
  }

  if (el.name === 'hr') {
    return {
      kind: 'element',
      tag: 'hr',
      display: 'block',
      style: parseInlineStyle(el.attribs.style),
      children: [],
    };
  }

  const tagStyle = DEFAULT_TAG_STYLES[el.name] ?? {};
  const inlineStyle = parseInlineStyle(el.attribs.style);
  const resolved: ResolvedStyle = { ...inherited, ...tagStyle, ...inlineStyle };
  const childPreserve = preserveWhitespace || el.name === 'pre';

  const element: RenderElement = {
    kind: 'element',
    tag: el.name,
    display: BLOCK_TAGS.has(el.name) ? 'block' : 'inline',
    style: resolved,
    children: el.children
      .map((c) => buildNode(c, resolved, childPreserve))
      .filter((c): c is RenderNode => c !== null),
  };

  if (el.name === 'a' && el.attribs.href) {
    element.href = el.attribs.href;
  }

  if (el.name === 'ul' || el.name === 'ol') {
    assignListMarkers(element, el.name === 'ol');
  }

  if (el.name === 'td' || el.name === 'th') {
    const colspan = parseInt(el.attribs.colspan ?? '', 10);
    if (!isNaN(colspan) && colspan > 1) {
      element.colSpan = colspan;
    }
  }

  return element;
}

function assignListMarkers(list: RenderElement, ordered: boolean): void {
  let index = 1;
  for (const child of list.children) {
    if (child.kind === 'element' && child.tag === 'li') {
      child.listMarker = ordered ? `${index}. ` : '\u2022  ';
      index++;
    }
  }
}

function buildImage(el: DomElement): RenderImage | null {
  const src = el.attribs.src;
  if (!src) return null;
  const image: RenderImage = { kind: 'image', src };
  if (el.attribs.alt) image.alt = el.attribs.alt;
  const width = parseDimension(el.attribs.width);
  if (width !== undefined) image.width = width;
  const height = parseDimension(el.attribs.height);
  if (height !== undefined) image.height = height;
  return image;
}

function parseDimension(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

function pickInherited(style: ResolvedStyle): ResolvedStyle {
  const out: ResolvedStyle = {};
  for (const key of INHERITED_PROPS) {
    const v = style[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}
