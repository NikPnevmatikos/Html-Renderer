import type {
  CustomRenderer,
  HTMLElementModel,
  RenderElement,
} from '@nikpnevmatikos/html-renderer';
import type { ComponentType } from 'react';

/** A playable source resolved from a media element. */
export interface MediaSource {
  uri: string;
  /** MIME type from the src-bearing element, when present (e.g. "video/mp4"). */
  mimeType?: string;
}

/** Props every player adapter receives from the video renderer. */
export interface VideoPlayerProps {
  source: MediaSource;
  poster?: string;
  controls: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  /** Pixel width to occupy: min(width attribute, contentWidth) when known. */
  width?: number;
  /** Ratio of the width/height attributes; defaults to 16/9. */
  aspectRatio: number;
  /** The underlying render-tree element, for advanced adapters. */
  node: RenderElement;
}

/** Ready-to-spread HtmlRenderer props wiring <video> to a player component. */
export interface VideoRenderersConfig {
  customRenderers: Record<string, CustomRenderer>;
  customHTMLElementModels: Record<string, HTMLElementModel>;
}

/**
 * Build the customRenderers / customHTMLElementModels pair that wires <video>
 * to the given player component:
 *
 *   const video = createVideoRenderers(MyPlayer);
 *   <HtmlRenderer html={html} {...video} />
 *
 * Player must be a real component — the renderer returns <Player /> elements,
 * so hooks are legal inside it. Elements with no usable source fall back to
 * their HTML fallback content.
 */
export function createVideoRenderers(
  _Player: ComponentType<VideoPlayerProps>,
): VideoRenderersConfig {
  throw new Error(
    '@nikpnevmatikos/html-renderer-video is under development: ' +
      'createVideoRenderers is not implemented yet.',
  );
}
