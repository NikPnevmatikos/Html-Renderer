---
sidebar_position: 2
title: Supported HTML
description: The block, inline, interactive and media tags the renderer understands, and how full documents and encoded input are handled.
---

# Supported HTML

## Block tags

`p`, `div`, `h1` to `h6`, `ul`, `ol`, `li`, `pre`, `blockquote`, `hr`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`, and `details` with `summary`.

Tables support `colspan`. `rowspan` is not supported yet, see [Limitations](./limitations.md).

## Inline tags

`span`, `strong` and `b`, `em` and `i`, `u`, `s`, `del` and `strike`, `ins`, `mark`, `small`, `code`, `a`, `br`, `img`.

## Interactive: details and summary

`<details>` and `<summary>` form a working disclosure widget. Tapping the summary row expands or collapses the content, with a ▸ or ▾ marker, `accessibilityRole="button"` and the expanded state exposed to assistive technology. The `open` attribute sets the initial state.

Configure it through `renderersProps.details`:

- `initialOpen` starts the widget expanded.
- `markerTextStyle` styles the marker.
- `onToggle(open, attribs)` observes changes.

A `customRenderers.details` entry still takes over entirely, as for any tag.

## Full documents

Complete documents work too. Literal `<html>` and `<body>` tags render as plain block containers. `<head>`, `<title>`, `<style>`, `<script>`, `<link>`, `<meta>` and `<base>` are ignored by default. Extend that list with the `ignoredDomTags` prop.

## Media

`<video>` and `<audio>` render their fallback content as blocks and expose all attributes to custom renderers. For native playback add the [video plugin](./plugins.md).

## Images

Images wider than `contentWidth` scale down proportionally. Use `renderersProps.img.initialDimensions` to reserve space before the image has loaded.

## Entity-encoded input

HTML that arrives encoded, such as `&lt;p&gt;hello&lt;/p&gt;` from a CMS or API, is detected and decoded before parsing. Double-encoded input is handled as well. No pre-processing is needed on your side.

## Your own tags

To give a custom tag block semantics, default styles or void behaviour, define it with `customHTMLElementModels`. See [Custom rendering](./custom-rendering.md).
