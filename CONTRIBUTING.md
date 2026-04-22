# Contributing

Thanks for considering contributing to Html-Renderer! This doc covers the essentials.

## Development setup

Requires Node 20+.

```bash
git clone https://github.com/NikPnevmatikos/Html-Renderer.git
cd Html-Renderer
npm install           # installs all workspace dependencies

npm run dev           # tsc --watch on @nikpnevmatikos/html-renderer
npm test              # run Jest suite (100+ tests)
npm run typecheck     # tsc --noEmit on core
npm run build         # build core to dist/

cd example && npm start  # run the demo Expo app
```

## Making changes

- **Write or update tests** for any change to the pipeline (`packages/core/src/**`). Test-first when fixing bugs.
- **Keep the render pipeline pure.** `parser/`, `render-tree/`, and `styles/` code must not import from `react-native`. Only the `renderer/` directory does.
- **Prefer additive API changes** over breaking ones. When breaking change is necessary, call it out in the PR description.
- **Run before opening a PR:**
  ```bash
  npm run typecheck && npm test && npm run build
  ```
- **Check the example app** still typechecks:
  ```bash
  cd example && npx tsc --noEmit
  ```

## Reporting issues

When opening a bug report, please include:

- **Minimal HTML reproduction** that triggers the bug
- **Expected** vs **actual** behavior
- Library version, React Native version, Expo SDK version (if applicable)
- Platform (iOS / Android / Web)

Use the issue templates in `.github/ISSUE_TEMPLATE/` when possible.

## Architectural notes

- The pipeline is intentionally split into pure data transforms: `parser` (HTML → DOM), `render-tree/build` (DOM → render tree), `render-tree/whitespace` (CSS-style collapse), `render-tree/hoist-blocks` (fragment inline-wrapping-block), and finally `renderer` (render tree → RN components).
- `styles/split.ts` splits a `ResolvedStyle` into View-applicable and Text-applicable halves — this is how we map CSS onto RN's split style system.
- The style cascade is resolved at build time, not render time, inside `styles/resolveStyles`.
- Custom renderers receive the resolved `RenderElement`, a `defaultRender` callback, and a `CustomRendererInfo` object.

## Scope — core vs plugin packages

The project is organized as a **pure-JS core** plus **plugin packages** for features that require native dependencies. This keeps the core library installable in Expo Go without a dev build, while still making heavier features available via opt-in packages.

### In scope for `@nikpnevmatikos/html-renderer` (core)

Anything that can be implemented with pure JavaScript and React Native's built-in components:

- Rendering content HTML (articles, posts, CMS output) and semantic markup
- Inline CSS and the `stylesheet` prop (with selectors and specificity)
- All existing extensibility hooks: `customRenderers`, `customHTMLElementModels`, `renderersProps`, `transformDom`, `onLinkPress`
- Roadmap (pure-JS additions planned for core):
  - `<input>`, `<textarea>`, `<button>`, `<select>` via RN's built-in `TextInput` / `Pressable`
  - `<form>` state coordination
  - CSS units (`em`, `rem`, `%` for font-size and line-height)
  - Attribute selectors (`[type="text"]`) in the stylesheet engine
  - Simple pseudo-classes (`:first-child`, `:last-child`, `:nth-child(n)`) that can be resolved at build time
  - Margin collapsing (experimental, opt-in)

### Plugin packages (features that need native dependencies)

Plugins are separate npm packages that ship ready-to-use `customRenderers` and `customHTMLElementModels` for tags the core doesn't know about. Each plugin declares its native dep as a `peerDependency` so the user's app controls the version.

Planned / contributor-welcome plugin packages:

| Tags | Package | Native peer dep |
|---|---|---|
| `<iframe>` | `@nikpnevmatikos/html-renderer-webview` | `react-native-webview` |
| `<video>`, `<audio>` | `@nikpnevmatikos/html-renderer-video` | `expo-video` or `react-native-video` |
| `<svg>` and children | `@nikpnevmatikos/html-renderer-svg` | `react-native-svg` |

See the README's "Custom renderer" and "Custom HTML element models" examples for the APIs a plugin uses. A plugin is typically ~30 lines of code.

### Likely never in scope

A few things are deliberately not part of the project, because they'd fight React Native's rendering model rather than working with it:

- CSS animations / transitions (use RN's `Animated` / `Reanimated` at the app level if you need motion)
- `@media` queries (use `Dimensions.get('window')` and pass different props)
- Dynamic pseudo-classes like `:hover` (no hover on touch devices; JS state is the right tool)
- Full HTML5 parser spec compliance (we use `htmlparser2` — good enough for content HTML, not for edge-case spec inputs)

These aren't rejections of contribution effort — they're cases where "do it yourself in React Native" is a cleaner answer than a leaky CSS-like abstraction.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
