---
sidebar_position: 4
title: Props
description: Every prop of the HtmlRenderer component.
---

# Props

| Prop | Type | Description |
|---|---|---|
| `html` | `string` | The HTML source to render. |
| `baseStyle` | `ResolvedStyle` | Root style. Inherited text props cascade to all content; box props (background, padding, and so on) style the root container. |
| `stylesheet` | `string` | A CSS stylesheet with real selectors: type, class, id, descendant, child. See [Styling and cascade](./styling.md). |
| `tagsStyles` | `Record<tag, StyleInput>` | Per-tag style override, for example `{ h1: {...} }`. `body` is special: it styles the document root even when the HTML is a fragment with no `<body>` tag. |
| `classesStyles` | `Record<class, StyleInput>` | Style by `class` attribute. |
| `idsStyles` | `Record<id, StyleInput>` | Style by `id` attribute. |
| `customRenderers` | `Record<tag, CustomRenderer>` | Replace or wrap the renderer for any tag. |
| `customHTMLElementModels` | `Record<tag, HTMLElementModel>` | Define new tags with custom block or inline semantics and default styles. |
| `renderersProps` | `Record<tag, Record<string, unknown>>` | Per-renderer config. Built-in consumers: `ol.startIndex`, `ul.markerTextStyle` and `ol.markerTextStyle`, `img.initialDimensions`, and `details` (`initialOpen`, `markerTextStyle`, `onToggle`). |
| `contentWidth` | `number` | Maximum render width. Images wider than this scale down proportionally. |
| `transformDom` | `(dom: DomNode[]) => DomNode[]` | Runs after parsing, before the render tree is built. Use it for sanitization or tag rewrites. |
| `onLinkPress` | `(href, attribs) => void` | Overrides the default `Linking.openURL` link handler. |
| `ignoredDomTags` | `string[]` | Tags to drop during parsing, subtree included. Merged with the built-in defaults: `head`, `title`, `style`, `script`, `link`, `meta`, `base`. |
| `ignoredStyles` | `string[]` | CSS properties to drop. Accepts kebab-case (`background-color`) or camelCase (`backgroundColor`). |
| `defaultTextProps` | `TextProps` | Spread onto every `<Text>`. |
| `defaultViewProps` | `ViewProps` | Spread onto every `<View>`. |
| `textSelectable` | `boolean` | Shortcut for `defaultTextProps.selectable = true`. |

## StyleInput

`StyleInput` is `ResolvedStyle | string`. Every style map accepts either a React Native style object or a CSS declaration string:

```tsx
tagsStyles={{
  h1: { color: 'red', fontSize: 24 },
  h2: 'color: blue; font-size: 20px',
}}
```

## Exported types

The package exports the types used above so you can annotate your own code, including `CustomRenderer`, `HTMLElementModel`, `OnLinkPress`, `StyleInput`, `TransformDom` and `DomNode`.
