import type { ResolvedStyle } from '../types';

export function parseInlineStyle(styleAttr: string | undefined): ResolvedStyle {
  if (!styleAttr) return {};
  const result: ResolvedStyle = {};

  for (const decl of styleAttr.split(';')) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim();
    if (!prop || !value) continue;
    applyCssProperty(result, prop, value);
  }

  return result;
}

const FONT_SIZE_KEYWORDS: Record<string, number> = {
  'xx-small': 9,
  'x-small': 10,
  small: 13,
  medium: 16,
  large: 18,
  'x-large': 24,
  'xx-large': 32,
  smaller: 12,
  larger: 16,
};

const BORDER_STYLES = new Set([
  'none',
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
  'hidden',
]);

function applyCssProperty(
  out: ResolvedStyle,
  prop: string,
  value: string,
): void {
  switch (prop) {
    case 'color':
      out.color = value;
      return;
    case 'background-color':
    case 'background':
      out.backgroundColor = value;
      return;
    case 'opacity': {
      const n = parseFloat(value);
      if (!isNaN(n)) out.opacity = n;
      return;
    }
    case 'font-size': {
      const kw = FONT_SIZE_KEYWORDS[value.trim().toLowerCase()];
      if (kw !== undefined) {
        out.fontSize = kw;
        return;
      }
      const px = parsePx(value);
      if (px !== null) out.fontSize = px;
      return;
    }
    case 'line-height': {
      const trimmed = value.trim();
      const unitless = /^-?\d+(?:\.\d+)?$/.exec(trimmed);
      if (unitless) {
        out.lineHeight = parseFloat(unitless[0]) * EM_BASE_PX;
        return;
      }
      const px = parsePx(value);
      if (px !== null) out.lineHeight = px;
      return;
    }
    case 'letter-spacing': {
      const px = parsePx(value);
      if (px !== null) out.letterSpacing = px;
      return;
    }
    case 'font-family':
      out.fontFamily = stripFontFamilyQuotes(value);
      return;
    case 'display':
      if (value === 'none' || value === 'flex') out.display = value;
      return;
    case 'font-weight': {
      if (value === 'bold' || value === 'normal') {
        out.fontWeight = value;
        return;
      }
      const num = parseInt(value, 10);
      if (!isNaN(num)) out.fontWeight = num >= 600 ? 'bold' : 'normal';
      return;
    }
    case 'font-style':
      if (value === 'italic' || value === 'normal') out.fontStyle = value;
      return;
    case 'text-align':
      if (
        value === 'left' ||
        value === 'right' ||
        value === 'center' ||
        value === 'justify'
      ) {
        out.textAlign = value;
      }
      return;
    case 'text-transform': {
      const v = value.trim().toLowerCase();
      if (
        v === 'none' ||
        v === 'uppercase' ||
        v === 'lowercase' ||
        v === 'capitalize'
      ) {
        out.textTransform = v;
      }
      return;
    }
    case 'text-decoration':
    case 'text-decoration-line': {
      const hasUnderline = value.includes('underline');
      const hasLineThrough = value.includes('line-through');
      if (hasUnderline && hasLineThrough) {
        out.textDecorationLine = 'underline line-through';
      } else if (hasUnderline) {
        out.textDecorationLine = 'underline';
      } else if (hasLineThrough) {
        out.textDecorationLine = 'line-through';
      } else {
        out.textDecorationLine = 'none';
      }
      return;
    }
    case 'margin':
      applyBoxShorthand(out, 'margin', value);
      return;
    case 'margin-top':
      setPx(out, 'marginTop', value);
      return;
    case 'margin-bottom':
      setPx(out, 'marginBottom', value);
      return;
    case 'margin-left':
      setPx(out, 'marginLeft', value);
      return;
    case 'margin-right':
      setPx(out, 'marginRight', value);
      return;
    case 'padding':
      applyBoxShorthand(out, 'padding', value);
      return;
    case 'padding-top':
      setPx(out, 'paddingTop', value);
      return;
    case 'padding-bottom':
      setPx(out, 'paddingBottom', value);
      return;
    case 'padding-left':
      setPx(out, 'paddingLeft', value);
      return;
    case 'padding-right':
      setPx(out, 'paddingRight', value);
      return;
    case 'border':
      applyBorderShorthand(out, value, null);
      return;
    case 'border-top':
      applyBorderShorthand(out, value, 'Top');
      return;
    case 'border-right':
      applyBorderShorthand(out, value, 'Right');
      return;
    case 'border-bottom':
      applyBorderShorthand(out, value, 'Bottom');
      return;
    case 'border-left':
      applyBorderShorthand(out, value, 'Left');
      return;
    case 'border-width':
      applySidesShorthand(out, value, 'Width', parsePx);
      return;
    case 'border-color':
      applySidesShorthand(out, value, 'Color', (v) => v);
      return;
    case 'border-style': {
      const v = value.trim().toLowerCase();
      if (v === 'solid' || v === 'dashed' || v === 'dotted') {
        out.borderStyle = v;
      }
      return;
    }
    case 'border-top-width':
      setPx(out, 'borderTopWidth', value);
      return;
    case 'border-right-width':
      setPx(out, 'borderRightWidth', value);
      return;
    case 'border-bottom-width':
      setPx(out, 'borderBottomWidth', value);
      return;
    case 'border-left-width':
      setPx(out, 'borderLeftWidth', value);
      return;
    case 'border-top-color':
      out.borderTopColor = value;
      return;
    case 'border-right-color':
      out.borderRightColor = value;
      return;
    case 'border-bottom-color':
      out.borderBottomColor = value;
      return;
    case 'border-left-color':
      out.borderLeftColor = value;
      return;
    case 'border-radius':
      applyBorderRadiusShorthand(out, value);
      return;
    case 'border-top-left-radius':
      setPx(out, 'borderTopLeftRadius', value);
      return;
    case 'border-top-right-radius':
      setPx(out, 'borderTopRightRadius', value);
      return;
    case 'border-bottom-left-radius':
      setPx(out, 'borderBottomLeftRadius', value);
      return;
    case 'border-bottom-right-radius':
      setPx(out, 'borderBottomRightRadius', value);
      return;
    case 'width':
      setDimension(out, 'width', value);
      return;
    case 'min-width':
      setDimension(out, 'minWidth', value);
      return;
    case 'max-width':
      setDimension(out, 'maxWidth', value);
      return;
    case 'height':
      setDimension(out, 'height', value);
      return;
    case 'min-height':
      setDimension(out, 'minHeight', value);
      return;
    case 'max-height':
      setDimension(out, 'maxHeight', value);
      return;
  }
}

type BoxProp = 'margin' | 'padding';

function applyBoxShorthand(
  out: ResolvedStyle,
  prop: BoxProp,
  value: string,
): void {
  const parts = tokenize(value).map(parsePx);
  if (parts.some((p) => p === null)) return;
  const [a, b, c, d] = parts as number[];
  let top: number, right: number, bottom: number, left: number;
  switch (parts.length) {
    case 1:
      top = right = bottom = left = a!;
      break;
    case 2:
      top = bottom = a!;
      right = left = b!;
      break;
    case 3:
      top = a!;
      right = left = b!;
      bottom = c!;
      break;
    case 4:
      top = a!;
      right = b!;
      bottom = c!;
      left = d!;
      break;
    default:
      return;
  }
  if (prop === 'margin') {
    out.marginTop = top;
    out.marginRight = right;
    out.marginBottom = bottom;
    out.marginLeft = left;
  } else {
    out.paddingTop = top;
    out.paddingRight = right;
    out.paddingBottom = bottom;
    out.paddingLeft = left;
  }
}

function applySidesShorthand<T>(
  out: ResolvedStyle,
  value: string,
  suffix: 'Width' | 'Color',
  parser: (v: string) => T | null,
): void {
  const parts = tokenize(value).map(parser);
  if (parts.some((p) => p === null || p === undefined)) return;
  const [a, b, c, d] = parts as T[];
  let top: T, right: T, bottom: T, left: T;
  switch (parts.length) {
    case 1:
      top = right = bottom = left = a!;
      break;
    case 2:
      top = bottom = a!;
      right = left = b!;
      break;
    case 3:
      top = a!;
      right = left = b!;
      bottom = c!;
      break;
    case 4:
      top = a!;
      right = b!;
      bottom = c!;
      left = d!;
      break;
    default:
      return;
  }
  (out as Record<string, unknown>)[`borderTop${suffix}`] = top;
  (out as Record<string, unknown>)[`borderRight${suffix}`] = right;
  (out as Record<string, unknown>)[`borderBottom${suffix}`] = bottom;
  (out as Record<string, unknown>)[`borderLeft${suffix}`] = left;
}

function applyBorderShorthand(
  out: ResolvedStyle,
  value: string,
  side: 'Top' | 'Right' | 'Bottom' | 'Left' | null,
): void {
  const tokens = tokenize(value);
  let width: number | undefined;
  let style: string | undefined;
  let color: string | undefined;
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (BORDER_STYLES.has(lower)) {
      style = lower;
      continue;
    }
    const px = parsePx(tok);
    if (px !== null && width === undefined) {
      width = px;
      continue;
    }
    if (color === undefined) color = tok;
  }
  if (side === null) {
    if (width !== undefined) {
      out.borderTopWidth = width;
      out.borderRightWidth = width;
      out.borderBottomWidth = width;
      out.borderLeftWidth = width;
      out.borderWidth = width;
    }
    if (color !== undefined) {
      out.borderTopColor = color;
      out.borderRightColor = color;
      out.borderBottomColor = color;
      out.borderLeftColor = color;
      out.borderColor = color;
    }
  } else {
    if (width !== undefined) {
      (out as Record<string, unknown>)[`border${side}Width`] = width;
    }
    if (color !== undefined) {
      (out as Record<string, unknown>)[`border${side}Color`] = color;
    }
  }
  if (style === 'solid' || style === 'dashed' || style === 'dotted') {
    out.borderStyle = style;
  }
}

function applyBorderRadiusShorthand(out: ResolvedStyle, value: string): void {
  const parts = tokenize(value).map(parsePx);
  if (parts.some((p) => p === null)) return;
  const [a, b, c, d] = parts as number[];
  let tl: number, tr: number, br: number, bl: number;
  switch (parts.length) {
    case 1:
      out.borderRadius = a!;
      return;
    case 2:
      tl = br = a!;
      tr = bl = b!;
      break;
    case 3:
      tl = a!;
      tr = bl = b!;
      br = c!;
      break;
    case 4:
      tl = a!;
      tr = b!;
      br = c!;
      bl = d!;
      break;
    default:
      return;
  }
  out.borderTopLeftRadius = tl;
  out.borderTopRightRadius = tr;
  out.borderBottomRightRadius = br;
  out.borderBottomLeftRadius = bl;
}

type NumberKey = {
  [K in keyof ResolvedStyle]: ResolvedStyle[K] extends number | undefined
    ? K
    : never;
}[keyof ResolvedStyle];

function setPx(out: ResolvedStyle, key: NumberKey, value: string): void {
  const px = parsePx(value);
  if (px !== null) (out as Record<string, unknown>)[key as string] = px;
}

type DimensionKey =
  | 'width'
  | 'minWidth'
  | 'maxWidth'
  | 'height'
  | 'minHeight'
  | 'maxHeight';

function setDimension(
  out: ResolvedStyle,
  key: DimensionKey,
  value: string,
): void {
  const dim = parseDimension(value);
  if (dim !== null) out[key] = dim;
}

function parseDimension(value: string): number | string | null {
  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?%$/.test(trimmed)) return trimmed;
  return parsePx(trimmed);
}

function stripFontFamilyQuotes(value: string): string {
  const first = value.split(',')[0]!.trim();
  return first.replace(/^["']|["']$/g, '');
}

const EM_BASE_PX = 14;

function parsePx(value: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)\s*(px|em|rem)?$/.exec(value);
  if (!match) return null;
  const n = parseFloat(match[1]!);
  const unit = match[2];
  if (unit === 'em' || unit === 'rem') {
    return n * EM_BASE_PX;
  }
  return n;
}

function tokenize(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') {
      depth++;
      cur += ch;
    } else if (ch === ')') {
      depth--;
      cur += ch;
    } else if (/\s/.test(ch) && depth === 0) {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}
