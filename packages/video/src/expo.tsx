import { useEffect, useState, type ReactElement } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
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
 * poster support).
 *
 * Until playback first starts, a play badge is overlaid whenever the poster
 * would otherwise hide the controls, or the element has no controls at all —
 * without it a poster frame is indistinguishable from a plain image, and a
 * controls-less video would be unstartable. Tapping the overlay starts
 * playback.
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

  const [status, setStatus] = useState(player.status);
  useEventListener(player, 'statusChange', (payload) => {
    setStatus(payload.status);
  });

  // Tracks a play request made before the media was ready, so the play
  // badge can show a spinner instead of appearing to do nothing.
  const [pendingPlay, setPendingPlay] = useState(false);

  const showOverlay = !started && (poster !== undefined || !controls);
  const buffering = status === 'loading';

  return (
    <View style={[width !== undefined ? { width } : styles.fullWidth, { aspectRatio }]}>
      <VideoView
        player={player}
        nativeControls={controls}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />
      {showOverlay ? (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setPendingPlay(true);
            player.play();
          }}
          accessibilityRole="button"
          accessibilityLabel="Play video"
        >
          {poster !== undefined ? (
            <Image
              source={{ uri: poster }}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={styles.playBadge}>
            {pendingPlay && buffering ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.playTriangle} />
            )}
          </View>
        </Pressable>
      ) : null}
      {started && buffering ? (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.playBadge}>
            <ActivityIndicator color="#ffffff" />
          </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 6,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
});
