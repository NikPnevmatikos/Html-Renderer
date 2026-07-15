import { useEffect, useState, type ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import type { VideoPlayerProps, VideoRenderersConfig } from './types';
import { createVideoRenderers } from './index';

/**
 * expo-video adapter for the HTML <video> renderer.
 *
 * Attribute mapping: controls → nativeControls, muted/loop → player
 * properties, autoplay → player.play() on creation, poster → an Image
 * overlay shown until playback first starts (expo-video has no native
 * poster support; the overlay ignores touches so the controls stay usable).
 */
export function ExpoVideoPlayer({
  source,
  poster,
  controls,
  autoplay,
  muted,
  loop,
  width,
  aspectRatio,
}: VideoPlayerProps): ReactElement {
  const player = useVideoPlayer(source.uri, (p) => {
    p.muted = muted;
    p.loop = loop;
    if (autoplay) p.play();
  });

  // On web the setup callback can run before the <video> element attaches,
  // dropping the play() call — re-request after mount (a no-op when the
  // player is already playing, e.g. on native).
  useEffect(() => {
    if (autoplay) player.play();
  }, [player, autoplay]);

  const [started, setStarted] = useState(autoplay);
  useEventListener(player, 'playingChange', (payload) => {
    if (payload.isPlaying) setStarted(true);
  });

  return (
    <View style={[width !== undefined ? { width } : styles.fullWidth, { aspectRatio }]}>
      <VideoView
        player={player}
        nativeControls={controls}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />
      {poster !== undefined && !started ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={{ uri: poster }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Ready-made HtmlRenderer props wired to expo-video: spread and go. */
export function createExpoVideoRenderers(): VideoRenderersConfig {
  return createVideoRenderers(ExpoVideoPlayer);
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
});
