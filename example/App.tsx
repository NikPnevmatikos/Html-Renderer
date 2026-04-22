import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import {
  HtmlRenderer,
  type CustomRenderer,
  type TransformDom,
  type DomNode,
} from '@html-renderer/core';

const demoHtml = `
  <h1>HtmlRenderer demo</h1>

  <h2>Colors (native RN support)</h2>
  <p style="color: rgb(220, 50, 50);">rgb() works.</p>
  <p style="color: rgba(50, 100, 220, 0.8);">rgba() works with alpha.</p>
  <p style="color: #d32f2f; background-color: hsl(50, 100%, 90%); padding: 6px;">hex + hsl() background.</p>

  <h2>Block-in-inline</h2>
  <p>Hello <strong>bold start <div style="background-color: #ffe; padding: 8px;">this div is block-display inside strong</div> bold end</strong> rest of paragraph.</p>

  <h2>transformDom hook</h2>
  <p>The word "REPLACE_ME" below gets replaced via transformDom: <em>REPLACE_ME</em>.</p>

  <h2>Code & pre</h2>
  <p>Inline <code>const x = 42;</code> code.</p>
  <pre>
function hello(name) {
  return "Hi, " + name;
}
  </pre>

  <h2>Blockquote</h2>
  <blockquote><p>"The best way to predict the future is to invent it." — Alan Kay</p></blockquote>

  <hr />

  <h2>Lists</h2>
  <ul>
    <li>First with <strong>bold</strong></li>
    <li>Second
      <ol>
        <li>Nested ordered</li>
        <li>Keeps numbering</li>
      </ol>
    </li>
  </ul>

  <h2>Tables</h2>
  <table>
    <caption>Quarterly results</caption>
    <thead>
      <tr>
        <th>Quarter</th>
        <th>Revenue</th>
        <th>Profit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Q1</td>
        <td>$120k</td>
        <td>$24k</td>
      </tr>
      <tr>
        <td>Q2</td>
        <td>$140k</td>
        <td>$31k</td>
      </tr>
      <tr>
        <td>Q3</td>
        <td>$180k</td>
        <td>$48k</td>
      </tr>
      <tr>
        <td><strong>Total</strong></td>
        <td colspan="2"><strong>$103k profit across Q1-Q3</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>Images</h2>
  <img src="https://picsum.photos/seed/big/1200/600" alt="Auto-fit big image" />

  <h2>Links</h2>
  <p>Tap <a href="https://expo.dev">expo.dev</a>.</p>
`;

const customRenderers: Record<string, CustomRenderer> = {
  h2: (_node, defaultRender) => (
    <View style={styles.h2Accent}>{defaultRender()}</View>
  ),
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
          customRenderers={customRenderers}
          contentWidth={contentWidth}
          transformDom={transformDom}
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
  h2Accent: {
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
    paddingLeft: 10,
    marginTop: 16,
    marginBottom: 4,
  },
});
