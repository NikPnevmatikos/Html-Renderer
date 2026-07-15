import type { RenderElement } from '@nikpnevmatikos/html-renderer';
import type { MediaSource, VideoPlayerProps } from './types';

const DEFAULT_ASPECT_RATIO = 16 / 9;

/**
 * Resolve the playable source per HTML semantics: the element's own `src`
 * attribute wins; otherwise the first `<source>` child that has a `src`.
 */
export function extractMediaSource(node: RenderElement): MediaSource | null {
  const direct = node.attribs?.src;
  if (direct) return { uri: direct };

  for (const child of node.children) {
    if (child.kind !== 'element' || child.tag !== 'source') continue;
    const src = child.attribs?.src;
    if (!src) continue;
    const mimeType = child.attribs?.type;
    return mimeType ? { uri: src, mimeType } : { uri: src };
  }
  return null;
}

function hasBoolAttr(node: RenderElement, name: string): boolean {
  return node.attribs !== undefined && name in node.attribs;
}

function positiveNumAttr(
  node: RenderElement,
  name: string,
): number | undefined {
  const raw = node.attribs?.[name];
  if (raw === undefined) return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Turn a <video> render-tree element into player props, or null when it has
 * no usable source (the caller should fall back to the element's children —
 * the HTML fallback content).
 */
export function extractPlayerProps(
  node: RenderElement,
  contentWidth?: number,
): VideoPlayerProps | null {
  const source = extractMediaSource(node);
  if (source === null) return null;

  const attrWidth = positiveNumAttr(node, 'width');
  const attrHeight = positiveNumAttr(node, 'height');
  const aspectRatio =
    attrWidth !== undefined && attrHeight !== undefined
      ? attrWidth / attrHeight
      : DEFAULT_ASPECT_RATIO;

  let width: number | undefined;
  if (attrWidth !== undefined && contentWidth !== undefined) {
    width = Math.min(attrWidth, contentWidth);
  } else {
    width = attrWidth ?? contentWidth;
  }

  const props: VideoPlayerProps = {
    source,
    controls: hasBoolAttr(node, 'controls'),
    autoplay: hasBoolAttr(node, 'autoplay'),
    muted: hasBoolAttr(node, 'muted'),
    loop: hasBoolAttr(node, 'loop'),
    aspectRatio,
    node,
  };
  const poster = node.attribs?.poster;
  if (poster) props.poster = poster;
  if (width !== undefined) props.width = width;
  return props;
}
