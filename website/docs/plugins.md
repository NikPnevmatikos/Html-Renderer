---
sidebar_position: 6
title: Plugins
description: Features that need native dependencies ship as separate packages. Video is available today; audio, iframe and SVG are planned.
---

# Plugins

Features that need native dependencies ship as separate packages, so the core stays free of native modules. Each plugin uses the core's `customRenderers` and `customHTMLElementModels` props, the same API described in [Custom rendering](./custom-rendering.md).

| Tags | Package | Native peer dependency | Status |
|---|---|---|---|
| `<video>` | [`@nikpnevmatikos/html-renderer-video`](https://www.npmjs.com/package/@nikpnevmatikos/html-renderer-video) | `expo-video`, optional: bring your own player | **Available** |
| `<audio>` | `@nikpnevmatikos/html-renderer-video` | | Planned |
| `<iframe>` | `@nikpnevmatikos/html-renderer-webview` | `react-native-webview` | Planned |
| `<svg>` | `@nikpnevmatikos/html-renderer-svg` | `react-native-svg` | Planned |

For tags without a plugin yet, wire them yourself with `customRenderers`. That is the same API the plugins use.

## Video

`@nikpnevmatikos/html-renderer-video` adds `<video>` support: a player-agnostic core with a ready-made `expo-video` adapter.

### Install

```bash
npm install @nikpnevmatikos/html-renderer-video
npx expo install expo-video   # only if you use the expo adapter
```

Requires `@nikpnevmatikos/html-renderer` 0.3.0 or newer. `expo-video` is an optional peer dependency and is only loaded when you import from the `/expo` entry point.

### Quick start with expo-video

```tsx
import { HtmlRenderer } from '@nikpnevmatikos/html-renderer';
import { createExpoVideoRenderers } from '@nikpnevmatikos/html-renderer-video/expo';

const videoSupport = createExpoVideoRenderers();

<HtmlRenderer
  html='<video controls poster="p.jpg" src="https://example.com/movie.mp4"></video>'
  contentWidth={width}
  {...videoSupport}
/>;
```

Already passing your own `customRenderers` or `customHTMLElementModels`? Merge instead of spreading:

```tsx
<HtmlRenderer
  customRenderers={{ ...myRenderers, ...videoSupport.customRenderers }}
  customHTMLElementModels={{ ...myModels, ...videoSupport.customHTMLElementModels }}
/>
```

### Bring your own player

The core is player-agnostic. `createVideoRenderers(Player)` accepts any component that takes `VideoPlayerProps`:

```tsx
import { createVideoRenderers, type VideoPlayerProps } from '@nikpnevmatikos/html-renderer-video';

function MyPlayer({ source, poster, controls, width, aspectRatio }: VideoPlayerProps) {
  return <SomeVideoLib uri={source.uri} /* ... */ />;
}

const videoSupport = createVideoRenderers(MyPlayer);
```

`Player` is rendered as a real component, so hooks are legal inside it.

| `VideoPlayerProps` | Meaning |
|---|---|
| `source` | `{ uri, mimeType? }`, the resolved playable source |
| `poster` | Poster image URL, when present |
| `controls`, `autoplay`, `muted`, `loop` | The HTML boolean attributes |
| `width` | Pixel width: the smaller of the `width` attribute and `contentWidth`, when known |
| `aspectRatio` | From the `width` and `height` attributes, else `16/9` |
| `node` | The raw render-tree element, for advanced adapters |

### HTML semantics

- **Source resolution.** The element's `src` attribute wins. Otherwise the first `<source>` child with a `src` is used, and its `type` becomes `source.mimeType`.
- **Fallback content.** A `<video>` with no usable source renders its children, which is what fallback content is for in HTML.
- **Sizing.** Width is capped at `contentWidth`. Height follows the aspect ratio.
- **Poster and play badge (expo adapter).** `expo-video` has no native poster, so the adapter overlays the poster image until playback first starts, together with a play badge. Tapping it starts playback. The badge also appears on videos without `controls`, which would otherwise be unstartable.
- **Loading (expo adapter).** A spinner replaces the play badge when playback is requested before the media is ready, and a spinner overlay appears during buffering stalls.

### Not covered yet

- `<audio>`. Planned. Needs custom control UI.
- A `react-native-video` adapter. Planned as a `/rnv` entry point if there is demand. `createVideoRenderers` already supports any player today.
- YouTube and Vimeo `<iframe>` embeds are a different tag and belong to the planned webview plugin.

### In Expo Snack

The video plugin works in Snack when the Snack runs Expo SDK 56 or newer. Older Snack runtimes do not ship `expo-video`, so the import fails on load there.
