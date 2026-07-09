import { parseDocument } from 'htmlparser2';
import { decodeHTML } from 'entities';
import type { Element, Text, Node } from 'domhandler';
import type { DomNode } from '../types';

// An entity-encoded tag opening, e.g. "&lt;p", "&lt;/span", "&#60;div".
// "(?:amp;)*" also catches double-encoded input such as "&amp;lt;p".
const ENCODED_TAG = /&(?:amp;)*(?:lt|#0*60|#x0*3c);[a-zA-Z!/]/i;
// A real tag opening, e.g. "<p" or "</span".
const REAL_TAG = /<[a-zA-Z!/]/;
// Bound on decode passes so nested encoding resolves without looping forever.
const MAX_DECODE_PASSES = 3;

export function parseHtml(html: string): DomNode[] {
  const doc = parseDocument(decodeIfEncoded(html), { decodeEntities: true });
  return doc.children
    .map(toDomNode)
    .filter((n): n is DomNode => n !== null);
}

/**
 * Some backends deliver HTML entity-escaped ("&lt;p&gt;hello&lt;/p&gt;").
 * Parsed directly that yields a single text node of literal markup, so when
 * the input contains encoded tags but no real ones, decode it first. Input
 * with any real tag is left untouched — there "&lt;" is intentional text.
 */
function decodeIfEncoded(html: string): string {
  let out = html;
  for (
    let pass = 0;
    pass < MAX_DECODE_PASSES && !REAL_TAG.test(out) && ENCODED_TAG.test(out);
    pass++
  ) {
    out = decodeHTML(out);
  }
  return out;
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
