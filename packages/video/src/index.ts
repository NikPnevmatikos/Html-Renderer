import { createElement, type ComponentType } from 'react';
import type { CustomRenderer } from '@nikpnevmatikos/html-renderer';
import type { VideoPlayerProps, VideoRenderersConfig } from './types';
import { extractPlayerProps } from './extract';

export type {
  MediaSource,
  VideoPlayerProps,
  VideoRenderersConfig,
} from './types';
export { extractMediaSource, extractPlayerProps } from './extract';

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
  Player: ComponentType<VideoPlayerProps>,
): VideoRenderersConfig {
  const video: CustomRenderer = (node, defaultRender, info) => {
    const props = extractPlayerProps(node, info.contentWidth);
    if (props === null) return defaultRender();
    return createElement(Player, props);
  };

  return {
    customRenderers: { video },
    customHTMLElementModels: {
      video: { display: 'block' },
    },
  };
}
