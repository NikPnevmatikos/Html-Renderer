---
sidebar_position: 3
title: Styling and cascade
description: Supported CSS, the stylesheet prop, the style maps, root styles and the exact cascade order.
---

# Styling and cascade

There are four ways to style content, and they combine in a defined order: a CSS `stylesheet`, the programmatic style maps (`tagsStyles`, `classesStyles`, `idsStyles`), root styles (`baseStyle` and `tagsStyles.body`), and inline `style="..."` attributes in the HTML itself.

## Supported CSS

- **Typography:** `color`, `font-size` (px), `font-family`, `font-weight`, `font-style`, `text-align`, `text-decoration`, `text-transform`, `letter-spacing`, `line-height` (px).
- **Box model:** `margin` and `padding` (shorthands and individual sides), `background-color`, the `border` family (shorthands, per-side widths and colors, `border-style`, `border-radius` including per-corner), `width` and `height` with `min-` and `max-` variants.
- **Other:** `opacity`, `display` (`flex` and `none`).
- **Colors:** hex, `rgb()`, `rgba()`, `hsl()` and named colors, passed through to React Native's color system.
- **Units:** `px` only for now. `em` and `rem` are not resolved yet, and `%` works only on `width` and `height`.

## The stylesheet prop

`stylesheet` takes a string of real CSS:

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

Supported selectors: type (`h1`), class (`.foo`), id (`#bar`), universal (`*`), compound (`h1.big#hero`), descendant (`article span`), child (`h1 > span`) and selector lists (`h1, h2`). Specificity and source order follow the CSS specification.

Not supported: pseudo-classes, pseudo-elements, attribute selectors, sibling combinators (`+`, `~`) and `@media` queries.

## Style maps

`tagsStyles`, `classesStyles` and `idsStyles` style elements by tag name, `class` attribute and `id` attribute. Each value is a `StyleInput`, which is either a React Native style object or a CSS declaration string:

```tsx
<HtmlRenderer
  html={html}
  tagsStyles={{
    h1: { color: 'red', fontSize: 24 },
    h2: 'color: blue; font-size: 20px',
  }}
  classesStyles={{ warning: { backgroundColor: '#fff3a3', padding: 8 } }}
  idsStyles={{ hero: { fontSize: 18, fontWeight: 'bold' } }}
/>
```

## Root styles

`tagsStyles.body` styles the document root even when the HTML is a fragment with no `<body>` element, as if the content were wrapped in a synthetic body. Inherited text properties cascade into all content. Box properties are applied once, to the root container. This makes it the natural place to set the root text color:

```tsx
<HtmlRenderer
  html="<p>Hello</p>"
  tagsStyles={{ body: { color: 'white' } }}
/>
```

`baseStyle` does the same thing one rung lower in the cascade, so `tagsStyles.body` wins where both set a property. If the HTML contains a literal `<body>` tag, `tagsStyles.body` is applied to that element instead, so box properties are never applied twice.

## Cascade order

From lowest to highest priority:

```text
1. baseStyle                  HtmlRenderer prop, root defaults
2. tagsStyles.body            document root, applies even without a <body> tag
3. Built-in tag defaults      h1 bold, strong bold, and so on
4. stylesheet matches         by selector specificity, then source order
5. tagsStyles                 per-tag programmatic override
6. classesStyles              by matched class
7. idsStyles                  by matched id
8. Inline style="..."         highest, inline HTML always wins
```

Root styles (1 and 2) reach descendants through inheritance, so only inherited text properties cascade down, and any element-level match (3 to 8) overrides them.

## Dropping properties

`ignoredStyles` removes CSS properties wherever they appear, including inline styles in the source HTML. It accepts kebab-case (`background-color`) or camelCase (`backgroundColor`) names.
