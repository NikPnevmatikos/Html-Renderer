---
sidebar_position: 8
title: Limitations
description: What the renderer does not do yet, and what is on the roadmap.
---

# Limitations

Actively on the roadmap:

- **No `rowspan` on tables.** `colspan` works.
- **CSS units beyond `px`.** `em` and `rem` are not resolved yet. `%` works only on `width` and `height`.
- **Forms.** `<input>`, `<textarea>`, `<button>` and `<select>` are not rendered yet. Planned for the core, pure JS via React Native's `TextInput` and `Pressable`.
- **Stylesheet features.** Pseudo-classes such as `:first-child` and `:nth-child`, attribute selectors such as `[type="text"]`, and `@media` queries are not supported yet.
- **Advanced CSS.** Transforms, and flex or grid layout of HTML content.
- **Table column sizing.** Cell `width` attributes are honored: a row where every cell has a percent width distributes columns proportionally, and sized cells in a mixed row keep their width while the rest share the remainder. Columns without any width render equal-width, and `width` on `<col>` is ignored.

Progress is tracked in the repository's [changelog](https://github.com/NikPnevmatikos/Html-Renderer/blob/main/CHANGELOG.md) and [issues](https://github.com/NikPnevmatikos/Html-Renderer/issues).
