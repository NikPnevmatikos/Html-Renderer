import type { ResolvedStyle } from '../types';
import { parseInlineStyle } from './parse-inline';

export interface SelectorPart {
  combinator: 'descendant' | 'child' | 'root';
  tag: string | null;
  classes: string[];
  ids: string[];
}

export interface Selector {
  parts: SelectorPart[];
  specificity: number;
}

export interface CssRule {
  selectors: Selector[];
  declarations: ResolvedStyle;
  sourceOrder: number;
}

export function parseStylesheet(css: string): CssRule[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  let order = 0;
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = ruleRegex.exec(noComments)) !== null) {
    const selectorList = match[1]!.trim();
    const decls = match[2]!.trim();
    if (!selectorList || !decls) continue;
    const selectors = parseSelectorList(selectorList);
    if (selectors.length === 0) continue;
    const declarations = parseInlineStyle(decls);
    rules.push({ selectors, declarations, sourceOrder: order++ });
  }
  return rules;
}

function parseSelectorList(text: string): Selector[] {
  return text
    .split(',')
    .map((s) => parseSelector(s.trim()))
    .filter((s): s is Selector => s !== null);
}

function parseSelector(text: string): Selector | null {
  if (!text) return null;
  const tokens = tokenizeSelector(text);
  const parts: SelectorPart[] = [];
  let combinator: 'descendant' | 'child' | 'root' = 'root';
  for (const tok of tokens) {
    if (tok === '>') {
      combinator = 'child';
      continue;
    }
    const part = parseCompound(tok);
    if (!part) return null;
    part.combinator = combinator;
    parts.push(part);
    combinator = 'descendant';
  }
  if (parts.length === 0) return null;
  const specificity = parts.reduce(
    (acc, p) =>
      acc + p.ids.length * 10000 + p.classes.length * 100 + (p.tag ? 1 : 0),
    0,
  );
  return { parts, specificity };
}

function tokenizeSelector(text: string): string[] {
  const result: string[] = [];
  const parts = text.split(/\s+/).filter(Boolean);
  for (const p of parts) {
    let current = '';
    for (const ch of p) {
      if (ch === '>') {
        if (current) {
          result.push(current);
          current = '';
        }
        result.push('>');
      } else {
        current += ch;
      }
    }
    if (current) result.push(current);
  }
  return result;
}

function parseCompound(text: string): SelectorPart | null {
  if (!text) return null;
  const re = /^([a-z*][\w-]*)?((?:[.#][\w-]+)*)$/i;
  const m = re.exec(text);
  if (!m) return null;
  const tag = m[1];
  const extras = m[2] ?? '';
  const classes: string[] = [];
  const ids: string[] = [];
  const tokenRe = /([.#])([\w-]+)/g;
  let tm;
  while ((tm = tokenRe.exec(extras)) !== null) {
    if (tm[1] === '.') classes.push(tm[2]!);
    else ids.push(tm[2]!);
  }
  return {
    combinator: 'root',
    tag: !tag || tag === '*' ? null : tag.toLowerCase(),
    classes,
    ids,
  };
}
