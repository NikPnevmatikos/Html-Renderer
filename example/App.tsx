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

const demoHtml = `
<p>The conference presents the key technological trends shaping the modern digital era, covering topics such as artificial intelligence, cybersecurity, and innovation. Its aim is to inform, encourage the exchange of ideas, and connect technology with real-world application.</p>
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
  body: {
        whiteSpace: 'normal',
        color: 'white'
      },
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
};

const renderersProps = {
  ol: { startIndex: 5 },
};

const customRenderers: Record<string, CustomRenderer> = {
  hr: () => (
    <View style={{ height: 2, backgroundColor: '#1a73e8', marginVertical: 16 }} />
  ),
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
    backgroundColor: 'blue',
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
