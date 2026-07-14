import type {
  DomNode,
  DomElement,
  HTMLElementModel,
  RenderNode,
  RenderElement,
  RenderImage,
  RenderText,
  ResolvedStyle,
  StyleInput,
} from '../types';
import { parseInlineStyle } from '../styles/parse-inline';
import { normalizeStyleInput, normalizeStyleMap } from '../styles/normalize';
import { resolveRootStyle } from '../styles/root';
import { parseStylesheet, type CssRule } from '../styles/css-parser';
import {
  matchSelector,
  type ElementInfo,
} from '../styles/selector-match';
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
  'article',
  'aside',
  'header',
  'footer',
  'main',
  'nav',
  'section',
  'figure',
  'figcaption',
  'address',
  'dl',
  'dt',
  'dd',
  // document containers — kept as plain block wrappers for full-document HTML
  'html',
  'body',
]);

const KNOWN_TAGS = new Set<string>([
  // block / sectioning
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'pre', 'blockquote', 'hr',
  'article', 'aside', 'footer', 'header', 'main', 'nav', 'section',
  'address', 'figure', 'figcaption', 'dl', 'dt', 'dd',
  // tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'col', 'colgroup',
  // inline / phrasing
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code',
  'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q',
  's', 'samp', 'small', 'span', 'strong', 'sub', 'sup',
  'time', 'u', 'var', 'wbr',
  'del', 'ins', 'strike', 'big', 'tt', 'font',
  // embedded
  'img', 'audio', 'video', 'picture', 'source', 'track',
  // document root (defensive — full-doc HTML)
  'html', 'head', 'body',
]);

// Non-rendered document tags, always merged with the user's ignoredDomTags.
// Without these, full-document HTML would render <title> text and raw
// <style>/<script> source as visible content.
const DEFAULT_IGNORED_DOM_TAGS = [
  'head',
  'title',
  'style',
  'script',
  'link',
  'meta',
  'base',
];

const warnedTags = new Set<string>();

function warnUnsupportedTag(tag: string): void {
  if (warnedTags.has(tag)) return;
  warnedTags.add(tag);
  // eslint-disable-next-line no-console
  console.warn(
    `[html-renderer] The "${tag}" tag is a valid HTML element but is not handled by this library. ` +
      `Add it to "customHTMLElementModels" to specify how it should be rendered, ` +
      `or to "ignoredDomTags" to skip it.`,
  );
}

const INHERITED_PROPS = [
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'textTransform',
  'letterSpacing',
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

export interface BuildOptions {
  baseStyle?: ResolvedStyle;
  tagsStyles?: Record<string, StyleInput>;
  classesStyles?: Record<string, StyleInput>;
  idsStyles?: Record<string, StyleInput>;
  ignoredDomTags?: string[];
  ignoredStyles?: string[];
  customHTMLElementModels?: Record<string, HTMLElementModel>;
  renderersProps?: Record<string, Record<string, unknown>>;
  stylesheet?: string;
}

interface BuildCtx {
  tagsStyles: Record<string, ResolvedStyle>;
  classesStyles: Record<string, ResolvedStyle>;
  idsStyles: Record<string, ResolvedStyle>;
  ignoredDomTags: Set<string>;
  ignoredStyleKeys: Set<string>;
  customHTMLElementModels: Record<string, HTMLElementModel>;
  renderersProps: Record<string, Record<string, unknown>>;
  stylesheetRules: CssRule[];
}

function cssNameToRN(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function buildIgnoredStyleKeys(input: string[] | undefined): Set<string> {
  const out = new Set<string>();
  if (!input) return out;
  for (const name of input) {
    out.add(name);
    out.add(cssNameToRN(name));
  }
  return out;
}

export function buildRenderTree(
  dom: DomNode[],
  options: BuildOptions = {},
): RenderNode[] {
  // Inherited half only: box props from baseStyle / tagsStyles.body belong to
  // the single root container (styled by the renderer), not to every
  // top-level element.
  const rootStyle = pickInherited(resolveRootStyle(options));
  const ctx: BuildCtx = {
    tagsStyles: normalizeStyleMap(options.tagsStyles),
    classesStyles: normalizeStyleMap(options.classesStyles),
    idsStyles: normalizeStyleMap(options.idsStyles),
    ignoredDomTags: new Set([
      ...DEFAULT_IGNORED_DOM_TAGS,
      ...(options.ignoredDomTags ?? []).map((t) => t.toLowerCase()),
    ]),
    ignoredStyleKeys: buildIgnoredStyleKeys(options.ignoredStyles),
    customHTMLElementModels: options.customHTMLElementModels ?? {},
    renderersProps: options.renderersProps ?? {},
    stylesheetRules: options.stylesheet ? parseStylesheet(options.stylesheet) : [],
  };
  const raw = dom
    .map((n) => buildNode(n, rootStyle, false, ctx, []))
    .filter((n): n is RenderNode => n !== null);
  return collapseWhitespace(hoistBlocks(raw));
}

function buildNode(
  node: DomNode,
  inherited: ResolvedStyle,
  preserveWhitespace: boolean,
  ctx: BuildCtx,
  ancestors: ElementInfo[],
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
  return buildElement(node, inherited, preserveWhitespace, ctx, ancestors);
}

function buildElement(
  el: DomElement,
  inherited: ResolvedStyle,
  preserveWhitespace: boolean,
  ctx: BuildCtx,
  ancestors: ElementInfo[],
): RenderNode | null {
  if (ctx.ignoredDomTags.has(el.name)) return null;

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

  const customModel = ctx.customHTMLElementModels[el.name];
  if (!customModel && !KNOWN_TAGS.has(el.name)) {
    warnUnsupportedTag(el.name);
  }
  const tagDefault = resolveTagDefault(el.name, customModel);

  const elInfo: ElementInfo = {
    tag: el.name,
    classes: (el.attribs.class ?? '').split(/\s+/).filter(Boolean),
    id: el.attribs.id ?? null,
  };

  if (el.name === 'hr') {
    return {
      kind: 'element',
      tag: 'hr',
      display: 'block',
      style: resolveStyles(el, inherited, ctx, tagDefault, elInfo, ancestors),
      children: [],
    };
  }

  const display =
    customModel?.display ??
    (BLOCK_TAGS.has(el.name) ? 'block' : 'inline');

  const resolved = resolveStyles(el, inherited, ctx, tagDefault, elInfo, ancestors);
  const childPreserve = preserveWhitespace || el.name === 'pre';

  const isVoid = customModel?.isVoid === true;
  const childAncestors = [...ancestors, elInfo];
  const inheritedForChildren = pickInherited(resolved);

  const element: RenderElement = {
    kind: 'element',
    tag: el.name,
    display,
    style: resolved,
    children: isVoid
      ? []
      : el.children
          .map((c) => buildNode(c, inheritedForChildren, childPreserve, ctx, childAncestors))
          .filter((c): c is RenderNode => c !== null),
  };

  if (el.name === 'a') {
    if (el.attribs.href) element.href = el.attribs.href;
    element.attribs = { ...el.attribs };
  }

  if (el.name === 'ul' || el.name === 'ol') {
    const ordered = el.name === 'ol';
    const start = ordered ? getStartIndex(el, ctx) : 1;
    assignListMarkers(element, ordered, start);
  }

  if (el.name === 'td' || el.name === 'th') {
    const colspan = parseInt(el.attribs.colspan ?? '', 10);
    if (!isNaN(colspan) && colspan > 1) {
      element.colSpan = colspan;
    }
  }

  return element;
}

function resolveTagDefault(
  tagName: string,
  customModel: HTMLElementModel | undefined,
): ResolvedStyle {
  const base = DEFAULT_TAG_STYLES[tagName] ?? {};
  if (!customModel?.tagDefaultStyle) return base;
  const modelStyle = normalizeStyleInput(customModel.tagDefaultStyle);
  return { ...base, ...modelStyle };
}

function resolveStyles(
  el: DomElement,
  inherited: ResolvedStyle,
  ctx: BuildCtx,
  tagDefault: ResolvedStyle,
  elInfo: ElementInfo,
  ancestors: ElementInfo[],
): ResolvedStyle {
  const stylesheetMerged = resolveStylesheetMatches(ctx, elInfo, ancestors);
  const tagsOverride = ctx.tagsStyles[el.name] ?? {};

  const classNames = elInfo.classes;
  let classesOverride: ResolvedStyle = {};
  for (const cls of classNames) {
    const match = ctx.classesStyles[cls];
    if (match) classesOverride = { ...classesOverride, ...match };
  }

  const id = elInfo.id;
  const idOverride = id ? (ctx.idsStyles[id] ?? {}) : {};

  const inlineStyle = parseInlineStyle(el.attribs.style);

  const merged: ResolvedStyle = {
    ...inherited,
    ...tagDefault,
    ...stylesheetMerged,
    ...tagsOverride,
    ...classesOverride,
    ...idOverride,
    ...inlineStyle,
  };

  if (ctx.ignoredStyleKeys.size > 0) {
    for (const key of ctx.ignoredStyleKeys) {
      delete (merged as Record<string, unknown>)[key];
    }
  }

  return merged;
}

function resolveStylesheetMatches(
  ctx: BuildCtx,
  elInfo: ElementInfo,
  ancestors: ElementInfo[],
): ResolvedStyle {
  if (ctx.stylesheetRules.length === 0) return {};

  const matched: Array<{
    declarations: ResolvedStyle;
    specificity: number;
    sourceOrder: number;
  }> = [];

  for (const rule of ctx.stylesheetRules) {
    for (const sel of rule.selectors) {
      if (matchSelector(sel, elInfo, ancestors)) {
        matched.push({
          declarations: rule.declarations,
          specificity: sel.specificity,
          sourceOrder: rule.sourceOrder,
        });
        break;
      }
    }
  }

  matched.sort((a, b) => {
    if (a.specificity !== b.specificity) {
      return a.specificity - b.specificity;
    }
    return a.sourceOrder - b.sourceOrder;
  });

  let merged: ResolvedStyle = {};
  for (const m of matched) {
    merged = { ...merged, ...m.declarations };
  }
  return merged;
}

function getStartIndex(el: DomElement, ctx: BuildCtx): number {
  const attrN = parseInt(el.attribs.start ?? '', 10);
  if (!isNaN(attrN)) return attrN;
  const olProps = ctx.renderersProps.ol as
    | { startIndex?: number }
    | undefined;
  return olProps?.startIndex ?? 1;
}

function assignListMarkers(
  list: RenderElement,
  ordered: boolean,
  start: number,
): void {
  let index = start;
  for (const child of list.children) {
    if (child.kind === 'element' && child.tag === 'li') {
      child.listMarker = ordered ? `${index}. ` : '\u2022  ';
      child.listOrdered = ordered;
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

export function treeContainsTag(nodes: RenderNode[], tag: string): boolean {
  for (const n of nodes) {
    if (n.kind !== 'element') continue;
    if (n.tag === tag) return true;
    if (treeContainsTag(n.children, tag)) return true;
  }
  return false;
}
