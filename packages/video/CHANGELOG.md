# Changelog

All notable changes to `@nikpnevmatikos/html-renderer-video` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-15

Initial release.

### Added

- Player-agnostic core: `createVideoRenderers(Player)` returns the `customRenderers` / `customHTMLElementModels` pair that wires `<video>` to any player component implementing the `VideoPlayerProps` contract.
- HTML semantics: the `src` attribute wins, else the first usable `<source>` child (its `type` carried as `source.mimeType`); elements with no playable source render their HTML fallback content; width is capped at `contentWidth`; aspect ratio derives from the `width`/`height` attributes (16/9 default); boolean attributes `controls`, `autoplay`, `muted`, `loop`.
- `expo-video` adapter at `@nikpnevmatikos/html-renderer-video/expo`: `createExpoVideoRenderers()` and `ExpoVideoPlayer`. Poster renders as an overlay until playback first starts, with a tap-to-play badge (also shown for controls-less videos, which would otherwise be unstartable). A loading spinner shows when playback is requested before the media is ready and during mid-playback buffering stalls. Autoplay is re-requested after mount (the web player drops `play()` issued from the `useVideoPlayer` setup callback). `expo-video` is an optional peer dependency, only required when importing the `./expo` subpath.
