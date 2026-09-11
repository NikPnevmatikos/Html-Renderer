---
sidebar_position: 7
title: How it works
description: The parse, build and render pipeline, and where styles are resolved.
---

# How it works

```text
HTML string
  └─ parseHtml (htmlparser2)         → DOM tree
    └─ transformDom? (optional)      → DOM tree
      └─ buildRenderTree             → Render tree
        └─ resolveStyles               (full cascade per element)
          └─ hoistBlocks               (fragment inline-wrapping-block)
            └─ collapseWhitespace      (CSS whitespace rules)
              └─ Renderer            → <View> / <Text> / <Image>
```

Styles resolve at build time into a single `ResolvedStyle` per element. At render time, `splitStyle` partitions each style into the half that applies to `<View>` and the half that applies to `<Text>`, and applies them to the correct component.

The render tree is transient: it is built for the given `html` and props, rendered, and discarded. There is no persistent DOM to keep in sync.

## Working on the repository

The repository is an npm workspaces monorepo: `packages/core` is the renderer, `packages/video` is the video plugin, `example` is an Expo app used for manual testing, and `website` is this site.

```bash
npm install           # installs all workspace deps
npm run dev           # tsc --watch on core
npm test              # jest, 130+ tests
npm run typecheck     # tsc --noEmit on core
npm run build         # build core to dist

# live example app
cd example && npm start

# this documentation site
cd website && npm install && npm start
```

Bug reports and pull requests are welcome on [GitHub](https://github.com/NikPnevmatikos/Html-Renderer). See the repository's `CONTRIBUTING.md` for the workflow.
