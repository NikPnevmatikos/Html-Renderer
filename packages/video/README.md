# @nikpnevmatikos/html-renderer-video

`<video>` support for [`@nikpnevmatikos/html-renderer`](https://www.npmjs.com/package/@nikpnevmatikos/html-renderer) — a player-agnostic core with a ready-made `expo-video` adapter.

## Install

```bash
npm install @nikpnevmatikos/html-renderer-video
npx expo install expo-video   # only if you use the expo adapter
```

Requires `@nikpnevmatikos/html-renderer >= 0.3.0`. `expo-video` is an **optional** peer dependency — it is only loaded when you import from `./expo`.

## Quick start (expo)

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

Already passing your own `customRenderers` / `customHTMLElementModels`? Merge instead of spreading:

```tsx
<HtmlRenderer
  customRenderers={{ ...myRenderers, ...videoSupport.customRenderers }}
  customHTMLElementModels={{ ...myModels, ...videoSupport.customHTMLElementModels }}
/>
```

## Bring your own player

The core is player-agnostic — `createVideoRenderers(Player)` accepts any component taking `VideoPlayerProps`:

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
| `source` | `{ uri, mimeType? }` — resolved playable source |
| `poster` | Poster image URL, when present |
| `controls` / `autoplay` / `muted` / `loop` | The HTML boolean attributes |
| `width` | Pixel width: `min(width attribute, contentWidth)` when known |
| `aspectRatio` | From the `width`/`height` attributes, else `16/9` |
| `node` | The raw render-tree element, for advanced adapters |

## HTML semantics

- **Source resolution:** the element's `src` attribute wins; otherwise the first `<source>` child with a `src` (its `type` becomes `source.mimeType`).
- **Fallback content:** a `<video>` with no usable source renders its children — exactly what fallback content is for in HTML.
- **Sizing:** width is capped at `contentWidth`; height follows the aspect ratio.
- **Poster & play badge (expo adapter):** `expo-video` has no native poster, so the adapter overlays the poster image until playback first starts, together with a play badge — tapping it starts playback. The badge also appears on videos without `controls`, which would otherwise be unstartable (HTML gives them no UI).
- **Loading (expo adapter):** a spinner replaces the play badge when playback is requested before the media is ready, and a spinner overlay appears during mid-playback buffering stalls.

## Not (yet) covered

- `<audio>` — planned; needs custom control UI.
- A `react-native-video` adapter — planned as a `./rnv` subpath if there is demand; `createVideoRenderers` already supports any player today.
- YouTube/Vimeo `<iframe>` embeds are a different tag — that belongs to the planned webview plugin, not this package.

## License

MIT — see [LICENSE](./LICENSE).
