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
    case 'font-size': {
      const px = parsePx(value);
      if (px !== null) out.fontSize = px;
      return;
    }
    case 'line-height': {
      const px = parsePx(value);
      if (px !== null) out.lineHeight = px;
      return;
    }
    case 'font-family':
      out.fontFamily = stripFontFamilyQuotes(value);
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
  }
}

type BoxProp = 'margin' | 'padding';

function applyBoxShorthand(
  out: ResolvedStyle,
  prop: BoxProp,
  value: string,
): void {
  const parts = value.split(/\s+/).map(parsePx);
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

function setPx(
  out: ResolvedStyle,
  key:
    | 'marginTop'
    | 'marginBottom'
    | 'marginLeft'
    | 'marginRight'
    | 'paddingTop'
    | 'paddingBottom'
    | 'paddingLeft'
    | 'paddingRight',
  value: string,
): void {
  const px = parsePx(value);
  if (px !== null) out[key] = px;
}

function stripFontFamilyQuotes(value: string): string {
  const first = value.split(',')[0]!.trim();
  return first.replace(/^["']|["']$/g, '');
}

function parsePx(value: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)\s*(px)?$/.exec(value);
  if (!match) return null;
  return parseFloat(match[1]!);
}
