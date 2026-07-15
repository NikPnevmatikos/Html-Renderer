import { extractMediaSource, extractPlayerProps } from './extract';
import { el, text } from './fixtures.test-util';

describe('extractMediaSource', () => {
  it('uses the src attribute directly', () => {
    expect(extractMediaSource(el('video', { src: 'v.mp4' }))).toEqual({
      uri: 'v.mp4',
    });
  });

  it('falls back to the first <source> child with a src, keeping its type', () => {
    const node = el('video', {}, [
      el('source', { type: 'video/webm' }),
      el('source', { src: 'v.webm', type: 'video/webm' }),
      el('source', { src: 'v.mp4', type: 'video/mp4' }),
    ]);
    expect(extractMediaSource(node)).toEqual({
      uri: 'v.webm',
      mimeType: 'video/webm',
    });
  });

  it('src attribute wins over <source> children', () => {
    const node = el('video', { src: 'direct.mp4' }, [
      el('source', { src: 'child.mp4' }),
    ]);
    expect(extractMediaSource(node)).toEqual({ uri: 'direct.mp4' });
  });

  it('omits mimeType when the winning <source> has no type', () => {
    const node = el('video', {}, [el('source', { src: 'v.mp4' })]);
    expect(extractMediaSource(node)).toEqual({ uri: 'v.mp4' });
  });

  it('ignores non-source children and returns null when nothing is playable', () => {
    const node = el('video', {}, [text('fallback'), el('track', { src: 't.vtt' })]);
    expect(extractMediaSource(node)).toBeNull();
  });
});

describe('extractPlayerProps', () => {
  it('returns null without a source', () => {
    expect(extractPlayerProps(el('video', { controls: '' }), 360)).toBeNull();
  });

  it('reads value-less boolean attributes (parsed as empty strings)', () => {
    const props = extractPlayerProps(
      el('video', { src: 'v.mp4', controls: '', muted: '', loop: '', autoplay: '' }),
    )!;
    expect(props.controls).toBe(true);
    expect(props.muted).toBe(true);
    expect(props.loop).toBe(true);
    expect(props.autoplay).toBe(true);
  });

  it('defaults boolean attributes to false when absent', () => {
    const props = extractPlayerProps(el('video', { src: 'v.mp4' }))!;
    expect(props.controls).toBe(false);
    expect(props.autoplay).toBe(false);
    expect(props.muted).toBe(false);
    expect(props.loop).toBe(false);
  });

  it('computes aspect ratio from width/height attributes', () => {
    const props = extractPlayerProps(
      el('video', { src: 'v.mp4', width: '640', height: '360' }),
    )!;
    expect(props.aspectRatio).toBeCloseTo(640 / 360);
  });

  it('falls back to 16/9 for missing or unusable dimensions', () => {
    for (const attribs of [
      { src: 'v.mp4' },
      { src: 'v.mp4', width: '640' },
      { src: 'v.mp4', width: '640', height: '0' },
      { src: 'v.mp4', width: 'banana', height: '360' },
    ]) {
      expect(extractPlayerProps(el('video', attribs))!.aspectRatio).toBeCloseTo(
        16 / 9,
      );
    }
  });

  it('caps the width attribute at contentWidth', () => {
    const node = el('video', { src: 'v.mp4', width: '640' });
    expect(extractPlayerProps(node, 360)!.width).toBe(360);
  });

  it('keeps a width attribute smaller than contentWidth', () => {
    const node = el('video', { src: 'v.mp4', width: '320' });
    expect(extractPlayerProps(node, 360)!.width).toBe(320);
  });

  it('uses contentWidth when there is no width attribute', () => {
    expect(extractPlayerProps(el('video', { src: 'v.mp4' }), 360)!.width).toBe(
      360,
    );
  });

  it('leaves width undefined when neither is known', () => {
    expect(extractPlayerProps(el('video', { src: 'v.mp4' }))!.width).toBeUndefined();
  });

  it('passes poster and the original node through', () => {
    const node = el('video', { src: 'v.mp4', poster: 'p.jpg' });
    const props = extractPlayerProps(node)!;
    expect(props.poster).toBe('p.jpg');
    expect(props.node).toBe(node);
  });
});
