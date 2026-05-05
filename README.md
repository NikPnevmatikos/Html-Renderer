# Html-Renderer

[![npm version](https://img.shields.io/npm/v/@nikpnevmatikos/html-renderer?color=blue&label=npm)](https://www.npmjs.com/package/@nikpnevmatikos/html-renderer)
[![CI](https://github.com/NikPnevmatikos/Html-Renderer/actions/workflows/ci.yml/badge.svg)](https://github.com/NikPnevmatikos/Html-Renderer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A modern React Native HTML renderer, written in TypeScript with **zero native modules**. Built from scratch as a maintained alternative to the abandoned `react-native-render-html`.

> **Status:** currently in alpha (`0.1.0-alpha.3`). Install with `@alpha` tag — see below.

- **Zero native code** — works on iOS, Android, Web (via `react-native-web`), and Expo Go without a dev build.
- **Fabric (new architecture) compatible** out of the box.
- **Real CSS stylesheet support** — a `stylesheet` prop that accepts actual CSS with selectors and specificity.
- Transient render tree model: HTML → DOM → resolved render tree → `<Text>` / `<View>` / `<Image>`.
- Full style inheritance, CSS cascade, and the box-model basics.
- Extensible via custom renderers, custom element models, DOM transform hooks, and per-renderer config.
- 100+ unit tests, typed end-to-end.

## Install

```bash
npm install @nikpnevmatikos/html-renderer@alpha
```

Peer dependencies: `react >= 18`, `react-native >= 0.73`.

> The `@alpha` tag is needed while the package is in prerelease. Once `0.1.0` stable is published, plain `npm install @nikpnevmatikos/html-renderer` will work.

## Quick start

```tsx
import { HtmlRenderer } from '@nikpnevmatikos/html-renderer';

export default function Screen() {
  return (
    <HtmlRenderer
      html={`<h1>Hello</h1><p>This is <strong>bold</strong> and <a href="https://x.dev">a link</a>.</p>`}
    />
  );
}
```

## Props

| Prop | Type | Description |
|---|---|---|
| `html` | `string` | The HTML source to render. |
| `baseStyle` | `ResolvedStyle` | Root style inherited by all content. |
| `stylesheet` | `string` | A CSS stylesheet with real selectors (type, class, id, descendant, child). |
| `tagsStyles` | `Record<tag, StyleInput>` | Per-tag style override (`{ h1: {...} }`). |
| `classesStyles` | `Record<class, StyleInput>` | Style by `class` attribute. |
| `idsStyles` | `Record<id, StyleInput>` | Style by `id` attribute. |
| `customRenderers` | `Record<tag, CustomRenderer>` | Replace or wrap the renderer for any tag. |
| `customHTMLElementModels` | `Record<tag, HTMLElementModel>` | Define new tags with custom block/inline semantics and default styles. |
| `renderersProps` | `Record<tag, Record<string, unknown>>` | Per-renderer config. Built-in consumers: `ol.startIndex`, `ul/ol.markerTextStyle`, `img.initialDimensions`. |
| `contentWidth` | `number` | Max render width. Images wider than this scale down proportionally. |
| `transformDom` | `(dom: DomNode[]) => DomNode[]` | Runs after parse, before build. Use for sanitization or tag rewrites. |
| `onLinkPress` | `(href, attribs) => void` | Override the default `Linking.openURL` link handler. |
| `ignoredDomTags` | `string[]` | Tags to drop during parse (subtree removed). |
| `ignoredStyles` | `string[]` | CSS properties to drop. Accepts kebab-case (`background-color`) or camelCase (`backgroundColor`). |
| `defaultTextProps` | `TextProps` | Spread onto every `<Text>`. |
| `defaultViewProps` | `ViewProps` | Spread onto every `<View>`. |
| `textSelectable` | `boolean` | Shortcut for `defaultTextProps.selectable = true`. |

`StyleInput` is `ResolvedStyle | string` — every style map accepts either an RN-style object *or* a CSS declarations string:

```tsx
tagsStyles={{
  h1: { color: 'red', fontSize: 24 },
  h2: 'color: blue; font-size: 20px',   // CSS string works too
}}
```

## Supported tags

**Block:** `p`, `div`, `h1–h6`, `ul`, `ol`, `li`, `pre`, `blockquote`, `hr`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`.

**Inline:** `span`, `strong`/`b`, `em`/`i`, `u`, `s`/`del`/`strike`, `ins`, `mark`, `small`, `code`, `a`, `br`, `img`.

## Supported CSS

- Typography: `color`, `font-size` (px), `font-family`, `font-weight`, `font-style`, `text-align`, `text-decoration`, `line-height` (px)
- Box model: `margin` (shorthand + individual sides), `padding` (shorthand + individual sides), `background-color`
- Colors: hex, `rgb()`, `rgba()`, `hsl()`, named (passed through to RN's color system)
- Units: **`px` only** for now — `em`/`rem`/`%` are not resolved yet

## Examples

### `stylesheet` — real CSS with selectors

```tsx
const css = `
  article.card {
    background-color: #fafbfc;
    padding: 12px;
  }
  article.card h3 {
    color: #1a73e8;
  }
  .highlight {
    background-color: #fff3a3;
  }
  h1 > span {
    font-weight: bold;
  }
`;

<HtmlRenderer html={html} stylesheet={css} />;
```

Supports: type (`h1`), class (`.foo`), id (`#bar`), universal (`*`), compound (`h1.big#hero`), descendant (`article span`), child (`h1 > span`), selector lists (`h1, h2`). Specificity and source order work per the CSS spec.

Not supported: pseudo-classes, pseudo-elements, attribute selectors, sibling combinators (`+`, `~`), `@media` queries.

### Custom renderer

```tsx
import { type CustomRenderer } from '@nikpnevmatikos/html-renderer';

const customRenderers: Record<string, CustomRenderer> = {
  h1: (node, defaultRender) => (
    <View style={{ borderBottomWidth: 2, borderBottomColor: 'blue' }}>
      {defaultRender()}
    </View>
  ),
};

<HtmlRenderer html={html} customRenderers={customRenderers} />;
```

### Custom HTML element models

Define your own tags that behave like real HTML:

```tsx
import { type HTMLElementModel } from '@nikpnevmatikos/html-renderer';

const customHTMLElementModels: Record<string, HTMLElementModel> = {
  'my-card': {
    display: 'block',
    tagDefaultStyle: { backgroundColor: '#eef', padding: 12 },
  },
  'x-spacer': {
    display: 'block',
    isVoid: true,  // ignore any children
    tagDefaultStyle: { height: 20 },
  },
};

<HtmlRenderer
  html="<my-card>hello</my-card>"
  customHTMLElementModels={customHTMLElementModels}
/>;
```

### DOM transform hook

```tsx
import { type TransformDom } from '@nikpnevmatikos/html-renderer';

const sanitize: TransformDom = (dom) => walk(dom);

function walk(nodes) {
  return nodes.map((n) => {
    if (n.type === 'element') {
      return { ...n, attribs: { ...n.attribs, onclick: '' }, children: walk(n.children) };
    }
    return n;
  });
}

<HtmlRenderer html={html} transformDom={sanitize} />;
```

### Link handling

```tsx
import { type OnLinkPress } from '@nikpnevmatikos/html-renderer';

const onLinkPress: OnLinkPress = (href, attribs) => {
  if (attribs.target === '_blank') {
    void Linking.openURL(href);
  } else {
    navigation.navigate('InAppBrowser', { url: href });
  }
};

<HtmlRenderer html={html} onLinkPress={onLinkPress} />;
```

### Auto-fit images

```tsx
import { Dimensions } from 'react-native';

const contentWidth = Dimensions.get('window').width - 32;

<HtmlRenderer html={html} contentWidth={contentWidth} />;
```

### Renderers props (per-renderer config)

```tsx
<HtmlRenderer
  html={html}
  renderersProps={{
    ol: { startIndex: 5, markerTextStyle: { color: '#888' } },
    ul: { markerTextStyle: { color: 'red' } },
    img: { initialDimensions: { width: 300, height: 200 } },
  }}
/>
```

## Cascade order

From lowest to highest priority:

```
1. baseStyle                         (HtmlRenderer prop — root defaults)
2. Built-in tag defaults             (h1 bold, strong bold, etc.)
3. stylesheet matches                (by selector specificity + source order)
4. tagsStyles                        (per-tag programmatic override)
5. classesStyles                     (by matched class)
6. idsStyles                         (by matched id)
7. Inline style="..."                (highest — HTML inline always wins)
```

## How it works

```
HTML string
  └─ parseHtml (htmlparser2)         → DOM tree
    └─ transformDom? (optional)      → DOM tree
      └─ buildRenderTree             → Render tree
        └─ resolveStyles               (full cascade per element)
          └─ hoistBlocks               (fragment inline-wrapping-block)
            └─ collapseWhitespace      (CSS whitespace rules)
              └─ Renderer            → <View> / <Text> / <Image>
```

Styles resolve at build time into a single `ResolvedStyle` per element. At render time, `splitStyle` partitions each style into View-applicable and Text-applicable halves and applies them to the correct component.

## Current limitations

Actively on the roadmap:

- **No `rowspan`** on tables (colspan works).
- **CSS units** beyond `px` — `em`, `rem`, `%` not resolved yet.
- **Forms** — `<input>`, `<textarea>`, `<button>`, `<select>` not yet rendered (planned for core, pure-JS via RN's `TextInput` / `Pressable`).
- **Stylesheet features** — pseudo-classes (`:first-child`, `:nth-child`), attribute selectors (`[type="text"]`), and `@media` queries not yet supported.
- **Advanced CSS** — transforms, opacity, individual `border-*` sides, `border-radius`, flex/grid display modes.
- **Intrinsic table column widths** — columns render equal-width (`flex: 1`); `width` on `<col>` / cells is ignored.

## Plugin packages (planned)

Features that need native dependencies ship as separate packages so the core stays zero-native-modules. Each uses the core's `customRenderers` and `customHTMLElementModels` APIs — no core changes needed to add them.

| Tags | Planned package | Native peer dep |
|---|---|---|
| `<iframe>` | `@nikpnevmatikos/html-renderer-webview` | `react-native-webview` |
| `<video>`, `<audio>` | `@nikpnevmatikos/html-renderer-video` | `expo-video` or `react-native-video` |
| `<svg>` | `@nikpnevmatikos/html-renderer-svg` | `react-native-svg` |

Until these ship, you can wire any of these tags yourself via `customRenderers` — the same API the plugins will use. See the "Custom renderer" and "Custom HTML element models" examples above.

## Development

```bash
npm install           # installs all workspace deps
npm run dev           # tsc --watch on core
npm test              # jest — 100+ tests
npm run typecheck     # tsc --noEmit on core
npm run build         # build core to dist

# live example app
cd example && npm start
```

## License

MIT — see [LICENSE](./LICENSE).
