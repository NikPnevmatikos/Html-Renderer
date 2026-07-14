import type { ResolvedStyle, StyleInput } from '../types';
import { normalizeStyleInput } from './normalize';

/** Default style at the document root — the seed of the inheritance cascade. */
export const ROOT_DEFAULT_STYLE: ResolvedStyle = {
  color: '#000000',
  fontSize: 14,
};

export interface RootStyleOptions {
  baseStyle?: ResolvedStyle;
  tagsStyles?: Record<string, StyleInput>;
}

/**
 * Effective document-root style: defaults ← baseStyle ← tagsStyles.body.
 *
 * `tagsStyles.body` contributes here even when the source HTML has no <body>
 * element, as if the content were wrapped in a synthetic body. Inherited text
 * properties cascade into all content; box properties (background, padding,
 * margin, borders) belong on the single root container, which the renderer
 * styles with the view half of this result.
 */
export function resolveRootStyle(options: RootStyleOptions): ResolvedStyle {
  const body = options.tagsStyles?.body;
  return {
    ...ROOT_DEFAULT_STYLE,
    ...(options.baseStyle ?? {}),
    ...(body !== undefined ? normalizeStyleInput(body) : {}),
  };
}
