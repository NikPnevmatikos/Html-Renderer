import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import SnackEmbed from '@site/src/components/SnackEmbed';

import styles from './index.module.css';

const features = [
  {
    title: 'Zero native modules',
    body: 'Pure TypeScript. Runs on iOS, Android and web via react-native-web, and in Expo Go without a dev build.',
  },
  {
    title: 'Real CSS',
    body: 'A stylesheet prop that takes actual CSS: type, class, id, descendant and child selectors, resolved with spec specificity.',
  },
  {
    title: 'New Architecture ready',
    body: 'No native code means nothing to migrate. Works on Fabric and on the old renderer alike.',
  },
  {
    title: 'Full cascade',
    body: 'Inheritance, tag defaults, stylesheet, per-tag, per-class and per-id overrides, then inline styles. In the order CSS defines.',
  },
  {
    title: 'Extensible',
    body: 'Custom renderers, custom element models, DOM transform hooks and per-renderer config. Plugins use the same API.',
  },
  {
    title: 'CMS-proof input',
    body: 'Entity-encoded HTML from backends, even double-encoded, is detected and rendered as HTML with no pre-decoding.',
  },
];

function Hero() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.hero)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/getting-started">
            Get started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="https://github.com/NikPnevmatikos/Html-Renderer">
            GitHub
          </Link>
        </div>
        <div className={styles.install}>
          <CodeBlock language="bash">npm install @nikpnevmatikos/html-renderer</CodeBlock>
        </div>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature) => (
            <div key={feature.title} className={clsx('col col--4', styles.feature)}>
              <Heading as="h3">{feature.title}</Heading>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Playground() {
  return (
    <section className={styles.playground}>
      <div className="container">
        <Heading as="h2">Try it live</Heading>
        <p>
          The example app from the repository, running in Expo Snack. Edit the HTML or the
          stylesheet on the left and watch the preview update. Snack needs Expo SDK 56 or newer for
          the video section, because older Snack runtimes do not ship <code>expo-video</code>.
        </p>
        <SnackEmbed />
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title="React Native HTML renderer" description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
        <Playground />
      </main>
    </Layout>
  );
}
