import { parseDocument } from 'htmlparser2';
import type { Element, Text, Node } from 'domhandler';
import type { DomNode } from '../types';

export function parseHtml(html: string): DomNode[] {
  const doc = parseDocument(html, { decodeEntities: true });
  return doc.children
    .map(toDomNode)
    .filter((n): n is DomNode => n !== null);
}

function toDomNode(n: Node): DomNode | null {
  if (n.type === 'text') {
    const t = n as Text;
    return { type: 'text', data: t.data };
  }
  if (n.type === 'tag') {
    const el = n as Element;
    return {
      type: 'element',
      name: el.name.toLowerCase(),
      attribs: { ...el.attribs },
      children: el.children
        .map(toDomNode)
        .filter((c): c is DomNode => c !== null),
    };
  }
  return null;
}
