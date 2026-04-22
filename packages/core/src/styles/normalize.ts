import type { ResolvedStyle, StyleInput } from '../types';
import { parseInlineStyle } from './parse-inline';

export function normalizeStyleInput(input: StyleInput): ResolvedStyle {
  return typeof input === 'string' ? parseInlineStyle(input) : input;
}

export function normalizeStyleMap(
  map: Record<string, StyleInput> | undefined,
): Record<string, ResolvedStyle> {
  if (!map) return {};
  const out: Record<string, ResolvedStyle> = {};
  for (const key of Object.keys(map)) {
    out[key] = normalizeStyleInput(map[key]!);
  }
  return out;
}
