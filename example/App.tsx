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
  <div class="row">
<div class="col-sm-12"><!-- Logo -->
<div class="company-logo" style="text-align: center; margin-bottom: 15px;">
<div style="max-width: 250px; margin: 0px auto;">{{Photo}}</div>
</div>
<!-- Accordion --><details class="company-accordion">
<summary>{{Company_Name}}</summary>
<div class="ev_connect-text" style="padding: 15px 0;">
<div style="margin-bottom: 15px;"><strong>Θέσεις εργασίας:</strong><br />{{tcustom_227546}}</div>
<div style="margin-bottom: 15px;"><strong>Διαγωνισμοί και give-aways:</strong><br />{{tcustom_227547}}</div>
<div><strong>Προωθητικές ενέργειες:</strong><br />{{tcustom_227548}}</div>
</div>
</details></div>
</div>
`;

// The {{...}} tokens are CMS template variables, normally substituted
// server-side before the HTML reaches the renderer. Sample values here so
// the demo renders realistic content.
const templateVars: Record<string, string> = {
  Photo:
    '<img src="https://picsum.photos/id/1050/500/280" alt="Company logo" width="250" height="140" />',
  Company_Name: 'Eventora S.A.',
  tcustom_227546: 'Frontend Engineer (React Native) — Αθήνα ή remote.',
  tcustom_227547: 'Κλήρωση για 2 προσκλήσεις στο συνέδριο, στο περίπτερό μας.',
  tcustom_227548: 'Δωρεάν demo και έκπτωση εγγραφής κατά τη διάρκεια του event.',
};

function fillTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

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
          html={fillTemplate(demoHtml, templateVars)}
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
