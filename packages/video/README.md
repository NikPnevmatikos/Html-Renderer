# @nikpnevmatikos/html-renderer-video

`<video>` support for [`@nikpnevmatikos/html-renderer`](https://www.npmjs.com/package/@nikpnevmatikos/html-renderer) — a player-agnostic core with a pre-wired `expo-video` adapter.

> **Status:** in development — player-agnostic core and `expo-video` adapter implemented; docs and example pending. Not yet published.

## Design

- `createVideoRenderers(Player)` returns `{ customRenderers, customHTMLElementModels }` to spread into `HtmlRenderer` props. Bring any player component.
- `@nikpnevmatikos/html-renderer-video/expo` (planned) ships a ready-made adapter using `expo-video` (optional peer dependency). A `react-native-video` adapter can follow as another subpath without a new package.
- Source resolution follows HTML semantics: the `src` attribute, else the first usable `<source>` child; elements with no source render their fallback content.
