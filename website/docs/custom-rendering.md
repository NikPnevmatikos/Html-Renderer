---
sidebar_position: 5
title: Custom rendering
description: Replace renderers, define your own tags, rewrite the DOM, handle links, size images and configure built-in renderers.
---

# Custom rendering

Every extension point uses the same small API surface. Plugins such as the [video plugin](./plugins.md) are built on exactly these props.

## Custom renderers

`customRenderers` replaces or wraps the renderer for a tag. The renderer receives the node and a `defaultRender` function, so wrapping the built-in output is one line:

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

Custom renderers are plain function calls, not components. If your renderer needs hooks, return a real component element from it and put the hooks inside that component.

## Custom HTML element models

`customHTMLElementModels` defines tags of your own that behave like real HTML: block or inline display, default styles, and void elements that ignore their children.

```tsx
import { type HTMLElementModel } from '@nikpnevmatikos/html-renderer';

const customHTMLElementModels: Record<string, HTMLElementModel> = {
  'my-card': {
    display: 'block',
    tagDefaultStyle: { backgroundColor: '#eef', padding: 12 },
  },
  'x-spacer': {
    display: 'block',
    isVoid: true,
    tagDefaultStyle: { height: 20 },
  },
};

<HtmlRenderer
  html="<my-card>hello</my-card>"
  customHTMLElementModels={customHTMLElementModels}
/>;
```

## DOM transform hook

`transformDom` runs after parsing and before the render tree is built. It receives the DOM as an array of nodes and returns the DOM to render. Use it for sanitization, tag rewrites or content substitution:

```tsx
import { type TransformDom, type DomNode } from '@nikpnevmatikos/html-renderer';

const transformDom: TransformDom = (dom) => rewriteText(dom);

function rewriteText(nodes: DomNode[]): DomNode[] {
  return nodes.map((n) => {
    if (n.type === 'text') {
      return { ...n, data: n.data.replace(/REPLACE_ME/g, 'replaced-by-hook') };
    }
    return { ...n, children: rewriteText(n.children) };
  });
}

<HtmlRenderer html={html} transformDom={transformDom} />;
```

## Link handling

By default links open with `Linking.openURL`. `onLinkPress` receives the `href` and the element's attributes, so you can route in-app instead:

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

## Auto-fit images

Pass `contentWidth` and images wider than it scale down proportionally:

```tsx
import { Dimensions } from 'react-native';

const contentWidth = Dimensions.get('window').width - 32;

<HtmlRenderer html={html} contentWidth={contentWidth} />;
```

## Renderer props

`renderersProps` passes configuration to individual renderers, built-in or custom:

```tsx
<HtmlRenderer
  html={html}
  renderersProps={{
    ol: { startIndex: 5, markerTextStyle: { color: '#888' } },
    ul: { markerTextStyle: { color: 'red' } },
    img: { initialDimensions: { width: 300, height: 200 } },
    details: { initialOpen: true },
  }}
/>
```
