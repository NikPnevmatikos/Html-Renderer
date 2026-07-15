import type {
  CustomRenderer,
  HTMLElementModel,
  RenderElement,
} from '@nikpnevmatikos/html-renderer';

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
