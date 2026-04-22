# Html-Renderer

A modern React Native HTML renderer, written in TypeScript with **zero native modules**. Built from scratch as a maintained alternative to the abandoned `react-native-render-html`.

- **Zero native code** — works on iOS, Android, Web (via `react-native-web`), and Expo Go without a dev build.
- **Fabric (new architecture) compatible** out of the box.
- **Real CSS stylesheet support** — a `stylesheet` prop that accepts actual CSS with selectors and specificity. (`react-native-render-html` doesn't do this.)
- Transient render tree model: HTML → DOM → resolved render tree → `<Text>` / `<View>` / `<Image>`.
- Full style inheritance, CSS cascade, and the box-model basics.
- Extensible via custom renderers, custom element models, DOM transform hooks, and per-renderer config.
- 100+ unit tests, typed end-to-end.

## Install

```bash
npm install @html-renderer/core
```

Peer dependencies: `react >= 18`, `react-native >= 0.73`.

## Quick start

```tsx
import { HtmlRenderer } from '@html-renderer/core';

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
import { type CustomRenderer } from '@html-renderer/core';

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
import { type HTMLElementModel } from '@html-renderer/core';

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
import { type TransformDom } from '@html-renderer/core';

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
import { type OnLinkPress } from '@html-renderer/core';

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

## Limitations

- **No `rowspan`** on tables (colspan works).
- **No CSS units** beyond `px` — `em`, `rem`, `%` not resolved yet.
- **No advanced CSS** — transforms, opacity, `border-radius`, individual `border-*` sides, flex/grid display modes.
- **No SVG, no forms, no iframes** — render these via custom renderers if needed (e.g., wire `react-native-svg`).
- **Intrinsic column widths** — table columns have equal widths (`flex: 1`); `width` on `<col>`/cells ignored.
- **No stylesheet pseudo-classes / attribute selectors** — type, class, id, descendant, child only.

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
