---
sidebar_position: 1
title: Getting started
description: Install @nikpnevmatikos/html-renderer and render your first HTML in React Native.
---

# Getting started

`@nikpnevmatikos/html-renderer` renders HTML in React Native. It is written in TypeScript, ships **zero native modules**, and gives you real CSS: a `stylesheet` prop that accepts selectors and resolves them with proper specificity.

## Why this renderer

- **Zero native code.** Works on iOS, Android and web (via `react-native-web`), and in Expo Go without a dev build.
- **New Architecture compatible** out of the box. There is nothing native to migrate.
- **Real CSS stylesheets.** Type, class, id, descendant and child selectors, with specificity and source order per the spec.
- **A transient render tree.** HTML is parsed to a DOM, resolved into a styled render tree, and emitted as `<Text>`, `<View>` and `<Image>` elements.
- **Full style inheritance and cascade**, plus the box-model basics.
- **Extensible.** Custom renderers, custom element models, DOM transform hooks and per-renderer config. Plugin packages use the same API.
- **Entity-encoded input handled.** HTML that arrives as `&lt;p&gt;hello&lt;/p&gt;` from a CMS or API, even double-encoded, is detected and rendered as HTML.
- **Typed end-to-end** and covered by 130+ unit tests.

## Install

```bash
npm install @nikpnevmatikos/html-renderer
```

Peer dependencies: `react >= 18` and `react-native >= 0.73`.

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

That is the whole integration. Everything else on this site is optional: styling, custom rendering, plugins.

## Try it without installing

The repository's example app runs in Expo Snack. Open it, edit the HTML or the stylesheet, and watch the preview update:

[Open the example in Snack](https://snack.expo.dev/?platform=web&sdkVersion=56.0.0&name=html-renderer%20example&dependencies=%40nikpnevmatikos%2Fhtml-renderer%2C%40nikpnevmatikos%2Fhtml-renderer-video%2C%40nikpnevmatikos%2Fhtml-renderer-video%2Fexpo%2Cexpo-video%2Cexpo-status-bar&files=%7B%22App.tsx%22%3A%7B%22type%22%3A%22CODE%22%2C%22url%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2FNikPnevmatikos%2FHtml-Renderer%2Fmain%2Fexample%2FApp.tsx%22%7D%7D)

Snack must be on Expo SDK 56 or newer for the `<video>` section, because older Snack runtimes do not ship `expo-video`.

## Where next

- [Supported HTML](./supported-html.md) for the tag list.
- [Styling and cascade](./styling.md) for the `stylesheet` prop, the style maps and the cascade order.
- [Props](./props.md) for the full component API.
- [Custom rendering](./custom-rendering.md) to replace renderers, define tags and rewrite the DOM.
- [Plugins](./plugins.md) for `<video>` support and what is planned.
