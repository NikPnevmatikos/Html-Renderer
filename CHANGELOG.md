# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04-22

### Added

- Initial release of `@nikpnevmatikos/html-renderer` — React Native HTML renderer in TypeScript, zero native modules, Fabric/Expo compatible.
- Core pipeline: HTML → DOM (via `htmlparser2`) → render tree → `<View>` / `<Text>` / `<Image>`.
- Supported block tags: `p`, `div`, `h1-h6`, `ul`, `ol`, `li`, `pre`, `blockquote`, `hr`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`.
- Supported inline tags: `span`, `strong`/`b`, `em`/`i`, `u`, `s`/`del`/`strike`, `ins`, `mark`, `small`, `code`, `a`, `br`, `img`.
- Inline CSS support: `color`, `font-*`, `text-*`, `line-height`, `margin`/`padding` (shorthand + individual sides), `background-color`.
- `stylesheet` prop — real CSS stylesheet support with selectors (type, class, id, universal, compound, descendant, child) and specificity-based cascade.
- `tagsStyles`, `classesStyles`, `idsStyles` — per-tag/class/id style maps accepting RN objects or CSS declaration strings.
- `customRenderers` — per-tag render override with `defaultRender` fallback.
- `customHTMLElementModels` — register new tags with custom display, default style, and `isVoid` semantics.
- `renderersProps` — per-renderer config. Built-in consumers: `ol.startIndex`, `ul`/`ol.markerTextStyle`, `img.initialDimensions`.
- `transformDom` hook for pre-render DOM mutation.
- `onLinkPress(href, attribs)` — override default `Linking.openURL` link handler.
- `contentWidth` — auto-scale oversized images.
- `ignoredDomTags`, `ignoredStyles` — filtering config.
- `defaultTextProps`, `defaultViewProps`, `textSelectable` — pass-through defaults to every Text/View.
- Accessibility roles for headings and links.
- Async image sizing via `Image.getSize()` with placeholder fallback.
- Whitespace collapsing per CSS rules; `<pre>` preserves whitespace.
- Block-in-inline fragmentation (hoists block elements out of inline ancestors).
- 104 unit tests across 8 suites.
- CI on Node 20 and 22.
