import { StatusBar } from 'expo-status-bar';
import { Alert, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import {
  HtmlRenderer,
  type CustomRenderer,
  type HTMLElementModel,
  type OnLinkPress,
  type StyleInput,
  type TransformDom,
  type DomNode,
} from '@nikpnevmatikos/html-renderer';
import { createExpoVideoRenderers } from '@nikpnevmatikos/html-renderer-video/expo';

const videoSupport = createExpoVideoRenderers();

const demoHtml = `
  <h1>HtmlRenderer demo</h1>

  <h2>stylesheet prop (real CSS with selectors)</h2>
  <article class="card">
    <h3>Card title (type + class cascade)</h3>
    <p>Body text inside an article.card. Styled via the <code>stylesheet</code> prop.</p>
    <p class="note">Nested elements matched by descendants: <span class="highlight">highlighted</span>.</p>
  </article>

  <h2>tagsStyles / classesStyles / idsStyles</h2>
  <p class="warning">Warning paragraph (classesStyles).</p>
  <p id="hero">Hero paragraph (idsStyles, highest programmatic specificity).</p>

  <h2>customHTMLElementModels — define new tags</h2>
  <my-card>
    <p><strong>my-card</strong> is not standard HTML. We defined it via customHTMLElementModels.</p>
  </my-card>

  <h2>renderersProps</h2>
  <p>Ordered list starts at 5 via <code>renderersProps.ol.startIndex</code>:</p>
  <ol>
    <li>Five</li>
    <li>Six</li>
    <li>Seven</li>
  </ol>

  <h2>onLinkPress</h2>
  <p>
    Tap the link:
    <a href="https://example.com" data-track="demo" target="_blank">
      example.com
    </a>
    (opens an Alert instead of the URL).
  </p>

  <h2>transformDom</h2>
  <p>The text <em>REPLACE_ME</em> gets rewritten before render.</p>

  <hr />

  <h2>Core features</h2>
  <p>Inline <code>const x = 42;</code>, <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, <mark>highlighted</mark>, <s>strikethrough</s>.</p>

  <pre>
function hello(name) {
  return "Hi, " + name;
}
  </pre>

  <blockquote><p>"Make it work, make it right, make it fast." — Kent Beck</p></blockquote>

  <h3>Table with colspan</h3>
  <table>
    <caption>Quarterly results</caption>
    <thead><tr><th>Quarter</th><th>Revenue</th><th>Profit</th></tr></thead>
    <tbody>
      <tr><td>Q1</td><td>$120k</td><td>$24k</td></tr>
      <tr><td>Q2</td><td>$140k</td><td>$31k</td></tr>
      <tr><td><strong>Total</strong></td><td colspan="2"><strong>$55k profit</strong></td></tr>
    </tbody>
  </table>

  <h3>Image (auto-fit to contentWidth)</h3>
  <img src="https://picsum.photos/seed/big/1200/600" alt="Auto-fit big image" />

  <h2>Video (@nikpnevmatikos/html-renderer-video)</h2>
  <p>Rendered with the expo-video adapter — poster, native controls, sized by contentWidth:</p>
  <video controls width="640" height="360" poster="https://picsum.photos/seed/videoposter/640/360">
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">
    Your device cannot play this video.
  </video>
`;

const stylesheet = `
  article.card {
    background-color: #fafbfc;
    padding: 12px;
    margin-bottom: 12px;
  }
  article.card h3 {
    color: #1a73e8;
    margin-bottom: 6px;
  }
  article.card .note {
    color: #666;
    font-size: 13px;
  }
  .highlight {
    background-color: #fff3a3;
    padding: 2px 4px;
  }
`;

const tagsStyles: Record<string, StyleInput> = {
  h2: 'color: #1a73e8; margin-top: 20px; margin-bottom: 6px;',
  p: { lineHeight: 22 },
};

const classesStyles: Record<string, StyleInput> = {
  warning: { backgroundColor: '#fff3a3', padding: 8 },
};

const idsStyles: Record<string, StyleInput> = {
  hero: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f' },
};

const customHTMLElementModels: Record<string, HTMLElementModel> = {
  'my-card': {
    display: 'block',
    tagDefaultStyle: {
      backgroundColor: '#e6f4ff',
      padding: 12,
      marginVertical: 6,
    },
  },
  ...videoSupport.customHTMLElementModels,
};

const renderersProps = {
  ol: { startIndex: 5 },
};

const customRenderers: Record<string, CustomRenderer> = {
  hr: () => (
    <View style={{ height: 2, backgroundColor: '#1a73e8', marginVertical: 16 }} />
  ),
  ...videoSupport.customRenderers,
};

const onLinkPress: OnLinkPress = (href, attribs) => {
  Alert.alert(
    'Link tapped',
    `href: ${href}\n\nattribs: ${JSON.stringify(attribs, null, 2)}`,
  );
};

const transformDom: TransformDom = (dom) => rewriteText(dom);

function rewriteText(nodes: DomNode[]): DomNode[] {
  return nodes.map((n) => {
    if (n.type === 'text') {
      return { ...n, data: n.data.replace(/REPLACE_ME/g, 'replaced-by-hook') };
    }
    return { ...n, children: rewriteText(n.children) };
  });
}

const windowWidth = Dimensions.get('window').width;
const contentWidth = windowWidth - 40;

export default function App() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <HtmlRenderer
          html={demoHtml}
          stylesheet={stylesheet}
          tagsStyles={tagsStyles}
          classesStyles={classesStyles}
          idsStyles={idsStyles}
          customHTMLElementModels={customHTMLElementModels}
          customRenderers={customRenderers}
          renderersProps={renderersProps}
          contentWidth={contentWidth}
          transformDom={transformDom}
          onLinkPress={onLinkPress}
          textSelectable
        />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
