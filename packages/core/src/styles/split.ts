import type { ResolvedStyle } from '../types';
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

const MONO_FAMILY =
  Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) ??
  'monospace';

const TEXT_KEYS = [
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'textDecorationLine',
  'textAlign',
  'textTransform',
  'letterSpacing',
  'lineHeight',
] as const;

const VIEW_KEYS = [
  'display',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderStyle',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
] as const;

export interface StyleSplit {
  view: ViewStyle;
  text: TextStyle;
}

export function splitStyle(style: ResolvedStyle): StyleSplit {
  const view: ViewStyle = {};
  const text: TextStyle = {};

  for (const k of TEXT_KEYS) {
    const v = style[k];
    if (v !== undefined) (text as Record<string, unknown>)[k] = v;
  }
  if (text.fontFamily === 'monospace') {
    text.fontFamily = MONO_FAMILY;
  }
  for (const k of VIEW_KEYS) {
    const v = style[k];
    if (v !== undefined) (view as Record<string, unknown>)[k] = v;
  }
  if (style.backgroundColor !== undefined) {
    view.backgroundColor = style.backgroundColor;
    text.backgroundColor = style.backgroundColor;
  }
  if (style.opacity !== undefined) {
    view.opacity = style.opacity;
    text.opacity = style.opacity;
  }

  return { view, text };
}
