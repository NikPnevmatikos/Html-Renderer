import {useEffect, useRef, type CSSProperties} from 'react';
import {useColorMode} from '@docusaurus/theme-common';

// Snack's embed script converts every element carrying data-snack-* attributes
// into an <iframe>. The attributes map 1:1 to Snack URL parameters. The code
// itself is fetched from the repository, so the playground always shows the
// example app that is on main.
const EMBED_SRC = 'https://snack.expo.dev/embed.js';

const FILES = encodeURIComponent(
  JSON.stringify({
    'App.tsx': {
      type: 'CODE',
      url: 'https://raw.githubusercontent.com/NikPnevmatikos/Html-Renderer/main/example/App.tsx',
    },
  }),
);

const DEPENDENCIES = encodeURIComponent(
  [
    '@nikpnevmatikos/html-renderer',
    '@nikpnevmatikos/html-renderer-video',
    // Deep imports must be listed as their own dependency for Snack to resolve them.
    '@nikpnevmatikos/html-renderer-video/expo',
    'expo-video',
    'expo-status-bar',
  ].join(','),
);

// expo-video is only bundled into Snack's runtime from SDK 56 onwards.
const SDK_VERSION = '56.0.0';

declare global {
  interface Window {
    ExpoSnack?: {
      initialize: () => void;
      append: (element: Element) => void;
      remove: (element: Element) => void;
    };
  }
}

const frameStyle: CSSProperties = {
  overflow: 'hidden',
  background: '#fafafa',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 8,
  height: 600,
  width: '100%',
};

export default function SnackEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const {colorMode} = useColorMode();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    if (window.ExpoSnack) {
      // Script already loaded (client-side navigation back to this page).
      window.ExpoSnack.append(element);
    } else {
      // First visit: the script scans the DOM once it loads, so the container
      // must already exist, which it does by the time this effect runs.
      const script = document.createElement('script');
      script.src = EMBED_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.ExpoSnack?.remove(element);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-snack-files={FILES}
      data-snack-dependencies={DEPENDENCIES}
      data-snack-sdkversion={SDK_VERSION}
      data-snack-platform="web"
      data-snack-preview="true"
      data-snack-name="html-renderer example"
      data-snack-theme={colorMode}
      data-snack-loading="lazy"
      style={frameStyle}
    />
  );
}
