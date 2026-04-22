import React from 'react';
import {
  Text,
  View,
  Linking,
  StyleSheet,
  type AccessibilityRole,
} from 'react-native';
import type {
  DomNode,
  RenderNode,
  RenderElement,
  RenderImage,
  ResolvedStyle,
} from '../types';
import { parseHtml } from '../parser/parse';
import { buildRenderTree } from '../render-tree/build';
import { splitStyle } from '../styles/split';
import { RenderedImage } from './RenderedImage';

export type CustomRenderer = (
  node: RenderElement,
  defaultRender: () => React.ReactNode,
) => React.ReactNode;

export type TransformDom = (dom: DomNode[]) => DomNode[];

export interface HtmlRendererProps {
  html: string;
  baseStyle?: ResolvedStyle;
  customRenderers?: Record<string, CustomRenderer>;
  contentWidth?: number;
  transformDom?: TransformDom;
}

interface RenderCtx {
  customRenderers: Record<string, CustomRenderer>;
  contentWidth?: number;
}

const ROOT_STYLE: ResolvedStyle = { color: '#000000', fontSize: 14 };
const EMPTY_CUSTOM: Record<string, CustomRenderer> = {};
const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

export function HtmlRenderer({
  html,
  baseStyle,
  customRenderers,
  contentWidth,
  transformDom,
}: HtmlRendererProps): React.ReactElement {
  const tree = React.useMemo(() => {
    const parsed = parseHtml(html);
    const dom = transformDom ? transformDom(parsed) : parsed;
    return buildRenderTree(dom, { baseStyle });
  }, [html, baseStyle, transformDom]);

  const ctx: RenderCtx = {
    customRenderers: customRenderers ?? EMPTY_CUSTOM,
    contentWidth,
  };
  const parentStyle = { ...ROOT_STYLE, ...(baseStyle ?? {}) };
  return <View>{renderBlockChildren(tree, parentStyle, ctx)}</View>;
}

type Segment =
  | { kind: 'run'; nodes: RenderNode[] }
  | { kind: 'image'; node: RenderImage }
  | { kind: 'block'; node: RenderElement };

function groupBlockChildren(children: RenderNode[]): Segment[] {
  const segments: Segment[] = [];
  let run: RenderNode[] = [];

  const flushRun = () => {
    if (run.length > 0) {
      segments.push({ kind: 'run', nodes: run });
      run = [];
    }
  };

  for (const c of children) {
    if (c.kind === 'image') {
      flushRun();
      segments.push({ kind: 'image', node: c });
    } else if (c.kind === 'element' && c.display === 'block') {
      flushRun();
      segments.push({ kind: 'block', node: c });
    } else {
      run.push(c);
    }
  }
  flushRun();

  return segments;
}

function renderBlockChildren(
  children: RenderNode[],
  parentStyle: ResolvedStyle,
  ctx: RenderCtx,
): React.ReactNode[] {
  const segments = groupBlockChildren(children);
  return segments.map((seg, i) => renderSegment(seg, parentStyle, i, ctx));
}

function renderSegment(
  seg: Segment,
  parentStyle: ResolvedStyle,
  key: React.Key,
  ctx: RenderCtx,
): React.ReactNode {
  switch (seg.kind) {
    case 'image':
      return (
        <RenderedImage key={key} node={seg.node} contentWidth={ctx.contentWidth} />
      );
    case 'block':
      return renderBlockElement(seg.node, key, ctx);
    case 'run': {
      const { text: tStyle } = splitStyle(parentStyle);
      return (
        <Text key={key} style={tStyle}>
          {seg.nodes.map((n, i) => renderInline(n, i, ctx))}
        </Text>
      );
    }
  }
}

function renderBlockElement(
  el: RenderElement,
  key: React.Key,
  ctx: RenderCtx,
): React.ReactNode {
  const custom = ctx.customRenderers[el.tag];
  if (custom) {
    return (
      <React.Fragment key={key}>
        {custom(el, () => renderBlockDefault(el, undefined, ctx))}
      </React.Fragment>
    );
  }
  return renderBlockDefault(el, key, ctx);
}

function renderBlockDefault(
  el: RenderElement,
  key: React.Key | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  const { view: vStyle, text: tStyle } = splitStyle(el.style);

  if (el.tag === 'hr') {
    return <View key={key} style={[styles.hr, vStyle]} />;
  }

  if (el.tag === 'ul' || el.tag === 'ol') {
    return (
      <View key={key} style={[styles.block, styles.list, vStyle]}>
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'li' && el.listMarker !== undefined) {
    return (
      <View key={key} style={[styles.listItem, vStyle]}>
        <Text style={[tStyle, styles.listMarker]}>{el.listMarker}</Text>
        <View style={styles.listItemContent}>
          {renderBlockChildren(el.children, el.style, ctx)}
        </View>
      </View>
    );
  }

  if (el.tag === 'pre') {
    return (
      <View key={key} style={[styles.block, styles.preBlock, vStyle]}>
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'blockquote') {
    return (
      <View key={key} style={[styles.block, styles.blockquote, vStyle]}>
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'table') {
    return (
      <View key={key} style={[styles.table, vStyle]}>
        {renderTableChildren(el.children, ctx)}
      </View>
    );
  }

  if (
    el.tag === 'thead' ||
    el.tag === 'tbody' ||
    el.tag === 'tfoot'
  ) {
    return (
      <View key={key}>
        {renderTableChildren(el.children, ctx)}
      </View>
    );
  }

  if (el.tag === 'tr') {
    return renderTableRow(el, key, ctx);
  }

  if (el.tag === 'td' || el.tag === 'th') {
    return renderTableCell(el, key, ctx);
  }

  if (el.tag === 'caption') {
    return (
      <View key={key} style={[styles.tableCaption, vStyle]}>
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  const a11yRole = blockA11yRole(el.tag);
  const a11yLevel = HEADING_LEVEL[el.tag];

  return (
    <View
      key={key}
      style={[styles.block, vStyle]}
      accessibilityRole={a11yRole}
      {...(a11yLevel !== undefined ? { 'aria-level': a11yLevel } : {})}
    >
      {renderBlockChildren(el.children, el.style, ctx)}
    </View>
  );
}

function blockA11yRole(tag: string): AccessibilityRole | undefined {
  if (tag in HEADING_LEVEL) return 'header';
  return undefined;
}

function renderTableChildren(
  children: RenderNode[],
  ctx: RenderCtx,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  children.forEach((c, i) => {
    if (c.kind !== 'element') return;
    out.push(renderBlockElement(c, i, ctx));
  });
  return out;
}

function renderTableRow(
  tr: RenderElement,
  key: React.Key | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  const cells: RenderElement[] = [];
  for (const c of tr.children) {
    if (c.kind === 'element' && (c.tag === 'td' || c.tag === 'th')) {
      cells.push(c);
    }
  }
  return (
    <View key={key} style={styles.tr}>
      {cells.map((cell, i) => renderTableCell(cell, i, ctx))}
    </View>
  );
}

function renderTableCell(
  cell: RenderElement,
  key: React.Key | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  const { view: vStyle } = splitStyle(cell.style);
  const flex = cell.colSpan ?? 1;
  return (
    <View key={key} style={[styles.tableCell, { flex }, vStyle]}>
      {renderBlockChildren(cell.children, cell.style, ctx)}
    </View>
  );
}

function renderInline(
  node: RenderNode,
  key: React.Key,
  ctx: RenderCtx,
): React.ReactNode {
  if (node.kind === 'text') {
    const { text: tStyle } = splitStyle(node.style);
    return (
      <Text key={key} style={tStyle}>
        {node.text}
      </Text>
    );
  }
  if (node.kind === 'image') {
    return null;
  }
  return renderInlineElement(node, key, ctx);
}

function renderInlineElement(
  el: RenderElement,
  key: React.Key,
  ctx: RenderCtx,
): React.ReactNode {
  const custom = ctx.customRenderers[el.tag];
  if (custom) {
    return (
      <React.Fragment key={key}>
        {custom(el, () => renderInlineDefault(el, undefined, ctx))}
      </React.Fragment>
    );
  }
  return renderInlineDefault(el, key, ctx);
}

function renderInlineDefault(
  el: RenderElement,
  key: React.Key | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  const { text: tStyle } = splitStyle(el.style);
  const children = el.children.map((c, i) => renderInline(c, i, ctx));

  if (el.tag === 'a' && el.href) {
    const href = el.href;
    return (
      <Text
        key={key}
        style={tStyle}
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(href);
        }}
      >
        {children}
      </Text>
    );
  }

  return (
    <Text key={key} style={tStyle}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  list: {
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listMarker: {
    marginRight: 4,
  },
  listItemContent: {
    flex: 1,
  },
  hr: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  preBlock: {
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 4,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    paddingLeft: 12,
    paddingVertical: 4,
    backgroundColor: '#fafafa',
  },
  table: {
    marginBottom: 8,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  tr: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableCaption: {
    padding: 6,
    marginBottom: 4,
  },
});
