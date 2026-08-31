import React from 'react';
import {
  Text,
  View,
  Linking,
  Pressable,
  StyleSheet,
  type AccessibilityRole,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import type {
  DomNode,
  HTMLElementModel,
  RenderNode,
  RenderElement,
  RenderImage,
  ResolvedStyle,
  StyleInput,
} from '../types';
import { parseHtml } from '../parser/parse';
import { buildRenderTree, treeContainsTag } from '../render-tree/build';
import { resolveRootStyle } from '../styles/root';
import { splitStyle } from '../styles/split';
import { RenderedImage } from './RenderedImage';
import { resolveRowCellFlex, type CellFlexStyle } from './table-layout';
import { splitDetailsChildren } from './details';

export interface CustomRendererInfo {
  renderersProps: Record<string, Record<string, unknown>>;
  contentWidth?: number;
}

export type CustomRenderer = (
  node: RenderElement,
  defaultRender: () => React.ReactNode,
  info: CustomRendererInfo,
) => React.ReactNode;

export type TransformDom = (dom: DomNode[]) => DomNode[];

export type OnLinkPress = (
  href: string,
  attribs: Record<string, string>,
) => void;

export interface HtmlRendererProps {
  html: string;
  baseStyle?: ResolvedStyle;
  tagsStyles?: Record<string, StyleInput>;
  classesStyles?: Record<string, StyleInput>;
  idsStyles?: Record<string, StyleInput>;
  stylesheet?: string;
  customRenderers?: Record<string, CustomRenderer>;
  customHTMLElementModels?: Record<string, HTMLElementModel>;
  renderersProps?: Record<string, Record<string, unknown>>;
  contentWidth?: number;
  transformDom?: TransformDom;
  onLinkPress?: OnLinkPress;
  ignoredDomTags?: string[];
  ignoredStyles?: string[];
  defaultTextProps?: TextProps;
  defaultViewProps?: ViewProps;
  textSelectable?: boolean;
}

interface RenderCtx {
  customRenderers: Record<string, CustomRenderer>;
  renderersProps: Record<string, Record<string, unknown>>;
  contentWidth?: number;
  onLinkPress?: OnLinkPress;
  defaultTextProps: TextProps;
  defaultViewProps: ViewProps;
}

const EMPTY_CUSTOM: Record<string, CustomRenderer> = {};
const EMPTY_RENDERERS_PROPS: Record<string, Record<string, unknown>> = {};
const EMPTY_TEXT_PROPS: TextProps = {};
const EMPTY_VIEW_PROPS: ViewProps = {};
const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

export function HtmlRenderer({
  html,
  baseStyle,
  tagsStyles,
  classesStyles,
  idsStyles,
  stylesheet,
  customRenderers,
  customHTMLElementModels,
  renderersProps,
  contentWidth,
  transformDom,
  onLinkPress,
  ignoredDomTags,
  ignoredStyles,
  defaultTextProps,
  defaultViewProps,
  textSelectable,
}: HtmlRendererProps): React.ReactElement {
  const { tree, hasBodyElement } = React.useMemo(() => {
    const parsed = parseHtml(html);
    const dom = transformDom ? transformDom(parsed) : parsed;
    const builtTree = buildRenderTree(dom, {
      baseStyle,
      tagsStyles,
      classesStyles,
      idsStyles,
      stylesheet,
      ignoredDomTags,
      ignoredStyles,
      customHTMLElementModels,
      renderersProps,
    });
    return {
      tree: builtTree,
      hasBodyElement: treeContainsTag(builtTree, 'body'),
    };
  }, [
    html,
    baseStyle,
    tagsStyles,
    classesStyles,
    idsStyles,
    stylesheet,
    transformDom,
    ignoredDomTags,
    ignoredStyles,
    customHTMLElementModels,
    renderersProps,
  ]);

  const mergedTextProps: TextProps = React.useMemo(() => {
    const base: TextProps = textSelectable ? { selectable: true } : {};
    return { ...base, ...(defaultTextProps ?? EMPTY_TEXT_PROPS) };
  }, [textSelectable, defaultTextProps]);

  const mergedViewProps = defaultViewProps ?? EMPTY_VIEW_PROPS;

  const ctx: RenderCtx = {
    customRenderers: customRenderers ?? EMPTY_CUSTOM,
    renderersProps: renderersProps ?? EMPTY_RENDERERS_PROPS,
    contentWidth,
    onLinkPress,
    defaultTextProps: mergedTextProps,
    defaultViewProps: mergedViewProps,
  };
  const rootStyle = React.useMemo(
    () => resolveRootStyle({ baseStyle, tagsStyles }),
    [baseStyle, tagsStyles],
  );
  // A literal <body> element receives tagsStyles.body itself — the root View
  // then takes only the baseStyle box props so padding/background/etc. are
  // not applied twice.
  const rootViewStyle = React.useMemo(
    () =>
      splitStyle(hasBodyElement ? resolveRootStyle({ baseStyle }) : rootStyle)
        .view,
    [hasBodyElement, baseStyle, rootStyle],
  );
  return (
    <View {...mergedViewProps} style={[mergedViewProps.style, rootViewStyle]}>
      {renderBlockChildren(tree, rootStyle, ctx)}
    </View>
  );
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
    case 'image': {
      const imgProps = ctx.renderersProps.img as
        | { initialDimensions?: { width: number; height: number } }
        | undefined;
      return (
        <RenderedImage
          key={key}
          node={seg.node}
          contentWidth={ctx.contentWidth}
          initialDimensions={imgProps?.initialDimensions}
        />
      );
    }
    case 'block':
      return renderBlockElement(seg.node, key, ctx);
    case 'run': {
      const { text: tStyle } = splitStyle(parentStyle);
      return (
        <Text key={key} {...ctx.defaultTextProps} style={tStyle}>
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
    const info: CustomRendererInfo = {
      renderersProps: ctx.renderersProps,
      contentWidth: ctx.contentWidth,
    };
    return (
      <React.Fragment key={key}>
        {custom(el, () => renderBlockDefault(el, undefined, ctx), info)}
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
    return (
      <View key={key} {...ctx.defaultViewProps} style={[styles.hr, vStyle]} />
    );
  }

  // Document containers: plain wrappers without the default block margin.
  if (el.tag === 'html' || el.tag === 'body') {
    return (
      <View key={key} {...ctx.defaultViewProps} style={vStyle}>
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'ul' || el.tag === 'ol') {
    return (
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.block, styles.list, vStyle]}
      >
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'li' && el.listMarker !== undefined) {
    const listKey = el.listOrdered ? 'ol' : 'ul';
    const listProps = ctx.renderersProps[listKey] as
      | { markerTextStyle?: StyleProp<TextStyle> }
      | undefined;
    const markerStyleOverride = listProps?.markerTextStyle;
    return (
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.listItem, vStyle]}
      >
        <Text
          {...ctx.defaultTextProps}
          style={[tStyle, styles.listMarker, markerStyleOverride]}
        >
          {el.listMarker}
        </Text>
        <View {...ctx.defaultViewProps} style={styles.listItemContent}>
          {renderBlockChildren(el.children, el.style, ctx)}
        </View>
      </View>
    );
  }

  if (el.tag === 'pre') {
    return (
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.block, styles.preBlock, vStyle]}
      >
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'blockquote') {
    return (
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.block, styles.blockquote, vStyle]}
      >
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'table') {
    return (
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.table, vStyle]}
      >
        {renderTableChildren(el.children, ctx)}
      </View>
    );
  }

  if (el.tag === 'thead' || el.tag === 'tbody' || el.tag === 'tfoot') {
    return (
      <View key={key} {...ctx.defaultViewProps}>
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
      <View
        key={key}
        {...ctx.defaultViewProps}
        style={[styles.tableCaption, vStyle]}
      >
        {renderBlockChildren(el.children, el.style, ctx)}
      </View>
    );
  }

  if (el.tag === 'details') {
    return <DetailsView key={key} el={el} ctx={ctx} />;
  }

  const a11yRole = blockA11yRole(el.tag);
  const a11yLevel = HEADING_LEVEL[el.tag];

  return (
    <View
      key={key}
      {...ctx.defaultViewProps}
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

export interface DetailsRendererProps {
  /** Start expanded even without an `open` attribute on the element. */
  initialOpen?: boolean;
  /** Style for the disclosure marker (▸/▾) next to the summary. */
  markerTextStyle?: StyleProp<TextStyle>;
  onToggle?: (open: boolean, attribs: Record<string, string>) => void;
}

function DetailsView({
  el,
  ctx,
}: {
  el: RenderElement;
  ctx: RenderCtx;
}): React.ReactElement {
  const detailsProps = ctx.renderersProps.details as
    | DetailsRendererProps
    | undefined;
  const attribs = el.attribs ?? {};
  const [open, setOpen] = React.useState(
    attribs.open !== undefined || detailsProps?.initialOpen === true,
  );
  const { summary, rest } = splitDetailsChildren(el.children);
  const { view: vStyle } = splitStyle(el.style);
  const summaryStyle = summary?.style ?? el.style;
  const { view: summaryVStyle, text: summaryTStyle } =
    splitStyle(summaryStyle);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    detailsProps?.onToggle?.(next, attribs);
  };

  return (
    <View {...ctx.defaultViewProps} style={[styles.block, vStyle]}>
      <Pressable
        accessibilityRole="button"
        // Both spellings: RN native reads accessibilityState, react-native-web
        // (0.19+) only maps the aria-* prop.
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={toggle}
        style={[styles.detailsSummaryRow, summaryVStyle]}
      >
        <Text
          {...ctx.defaultTextProps}
          style={[
            summaryTStyle,
            styles.detailsMarker,
            detailsProps?.markerTextStyle,
          ]}
        >
          {open ? '▾' : '▸'}
        </Text>
        <View {...ctx.defaultViewProps} style={styles.detailsSummaryContent}>
          {summary ? (
            renderBlockChildren(summary.children, summaryStyle, ctx)
          ) : (
            <Text {...ctx.defaultTextProps} style={summaryTStyle}>
              Details
            </Text>
          )}
        </View>
      </Pressable>
      {open ? (
        <View {...ctx.defaultViewProps}>
          {renderBlockChildren(rest, el.style, ctx)}
        </View>
      ) : null}
    </View>
  );
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
  const cellFlex = resolveRowCellFlex(
    cells.map((c) => ({ width: c.style.width, colSpan: c.colSpan })),
  );
  return (
    <View key={key} {...ctx.defaultViewProps} style={styles.tr}>
      {cells.map((cell, i) => renderTableCell(cell, i, ctx, cellFlex[i]))}
    </View>
  );
}

function renderTableCell(
  cell: RenderElement,
  key: React.Key | undefined,
  ctx: RenderCtx,
  flexStyle?: CellFlexStyle,
): React.ReactNode {
  const { view: vStyle } = splitStyle(cell.style);
  if (flexStyle) {
    // The row layout consumed the cell's width (as a proportion or as
    // flexBasis) — leaving it here too would fight the flex rule.
    delete vStyle.width;
  }
  const flexRule = (flexStyle ?? { flex: cell.colSpan ?? 1 }) as ViewStyle;
  return (
    <View
      key={key}
      {...ctx.defaultViewProps}
      style={[styles.tableCell, flexRule, vStyle]}
    >
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
      <Text key={key} {...ctx.defaultTextProps} style={tStyle}>
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
    const info: CustomRendererInfo = {
      renderersProps: ctx.renderersProps,
      contentWidth: ctx.contentWidth,
    };
    return (
      <React.Fragment key={key}>
        {custom(el, () => renderInlineDefault(el, undefined, ctx), info)}
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
    const attribs = el.attribs ?? {};
    return (
      <Text
        key={key}
        {...ctx.defaultTextProps}
        style={tStyle}
        accessibilityRole="link"
        onPress={() => {
          if (ctx.onLinkPress) {
            ctx.onLinkPress(href, attribs);
          } else {
            void Linking.openURL(href);
          }
        }}
      >
        {children}
      </Text>
    );
  }

  return (
    <Text key={key} {...ctx.defaultTextProps} style={tStyle}>
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
  detailsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailsMarker: {
    marginRight: 6,
  },
  detailsSummaryContent: {
    flex: 1,
  },
});
