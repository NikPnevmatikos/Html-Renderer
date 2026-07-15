import type { ComponentType, ReactElement } from 'react';
import type { RenderElement } from '@nikpnevmatikos/html-renderer';
import { createVideoRenderers, type VideoPlayerProps } from './index';
import { el, text } from './fixtures.test-util';

const Player: ComponentType<VideoPlayerProps> = () => null;

function render(node: RenderElement, contentWidth?: number) {
  const cfg = createVideoRenderers(Player);
  const renderer = cfg.customRenderers.video!;
  return renderer(node, () => 'FALLBACK', {
    renderersProps: {},
    ...(contentWidth !== undefined ? { contentWidth } : {}),
  });
}

describe('createVideoRenderers', () => {
  it('declares video as a block element model', () => {
    const cfg = createVideoRenderers(Player);
    expect(cfg.customHTMLElementModels.video).toEqual({ display: 'block' });
  });

  it('renders the player element with extracted props', () => {
    const node = el('video', {
      src: 'v.mp4',
      poster: 'p.jpg',
      controls: '',
      width: '640',
      height: '360',
    });
    const rendered = render(node, 360) as ReactElement<VideoPlayerProps>;
    expect(rendered.type).toBe(Player);
    expect(rendered.props.source).toEqual({ uri: 'v.mp4' });
    expect(rendered.props.poster).toBe('p.jpg');
    expect(rendered.props.controls).toBe(true);
    expect(rendered.props.width).toBe(360);
    expect(rendered.props.aspectRatio).toBeCloseTo(640 / 360);
    expect(rendered.props.node).toBe(node);
  });

  it('resolves <source> children', () => {
    const node = el('video', {}, [
      el('source', { src: 'v.webm', type: 'video/webm' }),
      text('fallback'),
    ]);
    const rendered = render(node) as ReactElement<VideoPlayerProps>;
    expect(rendered.type).toBe(Player);
    expect(rendered.props.source).toEqual({
      uri: 'v.webm',
      mimeType: 'video/webm',
    });
  });

  it('falls back to defaultRender when no source is playable', () => {
    expect(render(el('video', {}, [text('no video support')]))).toBe('FALLBACK');
  });
});
