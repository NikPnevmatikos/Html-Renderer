# Documentation site

Docusaurus site for `@nikpnevmatikos/html-renderer`, published to
https://nikpnevmatikos.github.io/Html-Renderer/ by `.github/workflows/docs.yml`
on every push to `main` that touches `website/`.

This folder is **not** an npm workspace member. It has its own `package.json`
and lockfile so Docusaurus dependencies never mix with the React Native ones.

```bash
cd website
npm install
npm start        # dev server with live reload at http://localhost:3000/Html-Renderer/
npm run build    # static build into website/build
```

- Pages live in `docs/`. Sidebar order comes from each page's `sidebar_position`.
- The landing page is `src/pages/index.tsx`. It embeds the repository's
  `example/App.tsx` in Expo Snack through `src/components/SnackEmbed.tsx`.
- Broken internal links and anchors fail the build on purpose.
