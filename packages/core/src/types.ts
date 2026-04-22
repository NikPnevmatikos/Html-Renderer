export type DomNode = DomElement | DomText;

export interface DomElement {
  type: 'element';
  name: string;
  attribs: Record<string, string>;
  children: DomNode[];
}

export interface DomText {
  type: 'text';
  data: string;
}

export interface ResolvedStyle {
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through';
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  lineHeight?: number;
  backgroundColor?: string;
  margin?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
}

export type RenderNode = RenderElement | RenderText | RenderImage;

export interface RenderElement {
  kind: 'element';
  tag: string;
  display: 'block' | 'inline';
  style: ResolvedStyle;
  href?: string;
  attribs?: Record<string, string>;
  listMarker?: string;
  listOrdered?: boolean;
  colSpan?: number;
  children: RenderNode[];
}

export type StyleInput = ResolvedStyle | string;

export interface HTMLElementModel {
  display?: 'block' | 'inline';
  tagDefaultStyle?: StyleInput;
  isVoid?: boolean;
}

export interface RenderText {
  kind: 'text';
  text: string;
  style: ResolvedStyle;
  preserveWhitespace?: boolean;
}

export interface RenderImage {
  kind: 'image';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}
