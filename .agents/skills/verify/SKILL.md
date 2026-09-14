---
name: verify
description: Verify @nikpnevmatikos/html-renderer changes end-to-end by driving the example Expo app on web.
---

# Verify Html-Renderer changes

1. Build first — the example consumes the package via `dist/`: `npm run build` (repo root).
2. Web runtime is installed in `example/` (`react-dom`, `react-native-web`, `@expo/metro-runtime`).
3. Start the server in the background: `cd example && CI=1 npx expo start --web --port 8081`.
   - `CI=1` makes expo non-interactive, but metro then does NOT watch files — restart the server after editing any source.
   - Stopping the background task leaves an orphaned node process on the port. Kill it before restarting:
     `Get-NetTCPConnection -LocalPort 8081 -State Listen | Select -Expand OwningProcess -Unique | % { Stop-Process -Id $_ -Force }`
4. Open http://localhost:8081 in the Browser pane.
5. To drive a specific feature, temporarily register a scratch screen from `example/index.ts` (`import App from './VerifyScreen'`), then revert and delete the scratch file.

Gotchas:
- The Browser pane `computer` screenshot action times out on this machine. Use `javascript_tool` with `getComputedStyle` and `get_page_text` for evidence instead — computed-style assertions are stronger evidence anyway.
- react-native-web renders `<a>` links as styled spans/divs with onPress, not `<a>` tags — locate elements by text (TreeWalker), not by tag/selector.
- Jest (`npm test`) covers only the node-side pipeline (`parse`/`build`/styles); `Renderer.tsx` and `split.ts` import react-native and have no unit coverage — renderer changes MUST be verified through the running app.
