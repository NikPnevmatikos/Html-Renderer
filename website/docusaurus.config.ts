import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Html-Renderer',
  tagline: 'React Native HTML renderer with real CSS support and zero native modules',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  // Published by .github/workflows/docs.yml to GitHub Pages.
  url: 'https://nikpnevmatikos.github.io',
  baseUrl: '/Html-Renderer/',
  organizationName: 'NikPnevmatikos',
  projectName: 'Html-Renderer',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/NikPnevmatikos/Html-Renderer/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Html-Renderer',
      logo: {
        alt: 'Html-Renderer logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/@nikpnevmatikos/html-renderer',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/NikPnevmatikos/Html-Renderer',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting started', to: '/docs/getting-started'},
            {label: 'Props', to: '/docs/props'},
            {label: 'Styling and cascade', to: '/docs/styling'},
            {label: 'Plugins', to: '/docs/plugins'},
          ],
        },
        {
          title: 'Project',
          items: [
            {label: 'GitHub', href: 'https://github.com/NikPnevmatikos/Html-Renderer'},
            {label: 'npm', href: 'https://www.npmjs.com/package/@nikpnevmatikos/html-renderer'},
            {
              label: 'Changelog',
              href: 'https://github.com/NikPnevmatikos/Html-Renderer/blob/main/CHANGELOG.md',
            },
            {label: 'Issues', href: 'https://github.com/NikPnevmatikos/Html-Renderer/issues'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} NikPnevmatikos. MIT licensed.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
