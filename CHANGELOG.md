# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-07-14

First stable (non-prerelease) release.

### Added

- `tagsStyles.body` now styles the document root even when the source HTML has no `<body>` element, as if the content were wrapped in a synthetic body. Inherited text properties (`color`, `font-*`, …) cascade into all content; box properties (background, padding, margin, borders) are applied once to the root container. The common `tagsStyles: { body: { color } }` pattern for setting the root text color now works as expected.
- Full-document HTML handling: literal `<html>`/`<body>` elements render as plain block containers (no default block margin), and `head`, `title`, `style`, `script`, `link`, `meta`, `base` are ignored by default (merged with any user-provided `ignoredDomTags`). Previously a full document rendered its `<title>` text and raw `<style>`/`<script>` source as visible content.
- New exports: `resolveRootStyle` / `ROOT_DEFAULT_STYLE` — the root-style resolution used by the renderer, for headless `buildRenderTree` consumers.

### Changed

- Box properties in `baseStyle` (and `tagsStyles.body`) no longer leak into every top-level element's resolved style; they now style the single root container. Same rationale as the 0.1.0-alpha.3 inheritance fix, applied to the root level. If you relied on `baseStyle.padding`/`backgroundColor` stamping each top-level block, the visual result is now one padded/painted wrapper instead.

## [0.1.0-alpha.4] - 2026-07-09

### Added

- Entity-encoded HTML support: input that is fully HTML-escaped (e.g. `&amp;lt;p&amp;gt;hello&amp;lt;/p&amp;gt;`, as returned by some CMS/API backends) is now auto-detected, decoded, and rendered as HTML instead of showing literal markup. Double-encoded input is handled too. Input containing any real tag is left untouched, so intentional escaped text like `<p>&amp;lt;b&amp;gt;</p>` still renders literally.
- `entities` is now a direct dependency (was already present transitively via `htmlparser2`).

## [0.1.0-alpha.3] - 2026-05-05

### Fixed

- CSS inheritance: children now inherit only inheritable text properties (`color`, `font-*`, `text-align`, `text-decoration-line`, `text-transform`, `letter-spacing`, `line-height`). Previously the parent's fully resolved style — including box properties such as margins, padding, and borders — leaked into children.

### Added

- HTML5 sectioning/semantic tags rendered as blocks by default: `article`, `aside`, `header`, `footer`, `main`, `nav`, `section`, `figure`, `figcaption`, `address`, `dl`, `dt`, `dd`.
- New CSS properties: the `border` family (shorthands, per-side widths/colors, `border-style`, `border-radius` including per-corner), `width`/`height` with `min-`/`max-` variants, `opacity`, `text-transform`, `letter-spacing`.
- One-time console warning for valid HTML tags the library doesn't handle, with a hint to register them via `customHTMLElementModels` or skip them via `ignoredDomTags`.

## [0.1.0-alpha.2] - 2026-04-22

### Fixed

- `display: 'none'` now correctly hides elements. Previously dropped during style splitting; the property is now routed to the underlying `<View>` style as RN expects. Affects both `classesStyles`/`idsStyles`/`tagsStyles` object values and inline CSS strings.

### Added

- `display` CSS property support (`flex` and `none` — RN's supported values).

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
