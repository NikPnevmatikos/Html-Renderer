# Html-Renderer

A modern, pure-JavaScript HTML renderer for React Native. Built from scratch as a maintained alternative to `react-native-render-html`.

- Pure JS — **no native modules**. Works on iOS, Android, Web (via `react-native-web`), and Expo Go without a dev build.
- **Fabric (new architecture) compatible** out of the box.
- Transient render tree model: HTML → DOM → resolved render tree → `<Text>` / `<View>` / `<Image>`.
- Full style inheritance and the CSS box-model basics.
- Extensible via custom renderers and a DOM pre-render hook.

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

| Prop              | Type                                                 | Description                                                                 |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `html`            | `string`                                             | The HTML source to render.                                                  |
| `baseStyle`       | `ResolvedStyle`                                      | Root style inherited by all content (font, color, etc.).                    |
| `contentWidth`    | `number`                                             | Max render width. Images wider than this are scaled down proportionally.    |
| `customRenderers` | `Record<string, CustomRenderer>`                     | Per-tag overrides. Receives the node and a `defaultRender` fallback.        |
| `transformDom`    | `(dom: DomNode[]) => DomNode[]`                      | Runs right after parse, before build. Use for sanitization or tag rewrites. |

## Supported tags

**Block:** `p`, `div`, `h1–h6`, `ul`, `ol`, `li`, `pre`, `blockquote`, `hr`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`.

**Inline:** `span`, `strong`/`b`, `em`/`i`, `u`, `s`/`del`/`strike`, `ins`, `mark`, `small`, `code`, `a`, `br`, `img`.

## Supported CSS (inline `style=""`)

- Typography: `color`, `font-size`, `font-family`, `font-weight`, `font-style`, `text-align`, `text-decoration`, `line-height`
- Box: `margin` (+ shorthands + individual sides), `padding` (+ shorthands + individual sides), `background-color`
- Colors: hex, `rgb()`, `rgba()`, `hsl()`, named (passed through to RN's color system)

## Examples

### Custom renderer

```tsx
import { HtmlRenderer, type CustomRenderer } from '@html-renderer/core';

const customRenderers: Record<string, CustomRenderer> = {
  h1: (_node, defaultRender) => (
    <View style={{ borderBottomWidth: 2, borderBottomColor: 'blue' }}>
      {defaultRender()}
    </View>
  ),
};

<HtmlRenderer html={html} customRenderers={customRenderers} />;
```

### DOM transform

```tsx
import { HtmlRenderer, type TransformDom, type DomNode } from '@html-renderer/core';

const stripAttributes: TransformDom = (dom) => walk(dom);

function walk(nodes: DomNode[]): DomNode[] {
  return nodes.map((n) => {
    if (n.type === 'element') {
      return { ...n, attribs: { ...n.attribs, onclick: '' }, children: walk(n.children) };
    }
    return n;
  });
}

<HtmlRenderer html={html} transformDom={stripAttributes} />;
```

### Auto-fit images

```tsx
import { Dimensions } from 'react-native';

const contentWidth = Dimensions.get('window').width - 32;

<HtmlRenderer html={html} contentWidth={contentWidth} />;
```

## How it works

```
HTML string
  └─ parseHtml (htmlparser2)      → DOM tree
    └─ transformDom? (optional)   → DOM tree
      └─ buildRenderTree          → Render tree
        └─ hoistBlocks             (fragment inline-wrapping-block)
          └─ collapseWhitespace    (CSS-style whitespace rules)
            └─ Renderer           → <View> / <Text> / <Image>
```

Styles are resolved during build via a simple cascade (inherited props + tag defaults + inline `style=""`), stored on each render node. The renderer splits the resolved style into View-applicable vs Text-applicable halves at render time.

## Limitations

- **No `rowspan`** on tables — colspan is supported; rowspan needs absolute positioning + row-height tracking and is not implemented.
- **No advanced CSS** — transforms, opacity, borders (individual sides), `border-radius`, flex/grid display modes are not supported yet.
- **No SVG** — by design, to stay native-module-free. Render SVG via a custom renderer using `react-native-svg` if needed.
- **No forms** — `<input>`, `<textarea>`, `<button>` are not rendered.
- **Intrinsic column widths** — table columns have equal widths (`flex: 1`); `width` attributes on `<col>`/cells are ignored.

## Development

```bash
npm install           # installs all workspace deps
npm run dev           # tsc --watch on @html-renderer/core
npm test              # jest — 52+ tests
npm run typecheck     # tsc --noEmit on core
npm run build         # build to packages/core/dist

# live example app
cd example && npm start
```

## License

MIT — see [LICENSE](./LICENSE).
