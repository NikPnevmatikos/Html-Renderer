import type { RenderNode, RenderText } from '../types';

const WHITESPACE_RUN = /[\t\n\r\f ]+/g;

export function collapseWhitespace(nodes: RenderNode[]): RenderNode[] {
  return processBlockContext(nodes);
}

function processBlockContext(nodes: RenderNode[]): RenderNode[] {
  const recursed = nodes.map((n) => {
    if (n.kind === 'element' && n.display === 'block') {
      return { ...n, children: processBlockContext(n.children) };
    }
    return n;
  });

  const result: RenderNode[] = [];
  let segment: RenderNode[] = [];

  const flush = () => {
    collapseInlineSegment(segment);
    for (const n of segment) {
      if (!isEmptyText(n)) result.push(n);
    }
    segment = [];
  };

  for (const n of recursed) {
    const breaking =
      (n.kind === 'element' && n.display === 'block') || n.kind === 'image';
    if (breaking) {
      flush();
      result.push(n);
    } else {
      segment.push(n);
    }
  }
  flush();

  return result;
}

function collapseInlineSegment(segment: RenderNode[]): void {
  const leaves: RenderText[] = [];
  for (const n of segment) collectTextLeaves(n, leaves);
  if (leaves.length === 0) return;

  for (const leaf of leaves) {
    if (!leaf.preserveWhitespace) {
      leaf.text = leaf.text.replace(WHITESPACE_RUN, ' ');
    }
  }

  let prevEndsWithSpace = true;
  for (const leaf of leaves) {
    if (leaf.preserveWhitespace) {
      prevEndsWithSpace = false;
      continue;
    }
    if (leaf.text.startsWith(' ') && prevEndsWithSpace) {
      leaf.text = leaf.text.slice(1);
    }
    prevEndsWithSpace = leaf.text.endsWith(' ');
  }

  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i]!;
    if (leaf.preserveWhitespace) break;
    if (leaf.text.endsWith(' ')) {
      leaf.text = leaf.text.slice(0, -1);
    }
    if (leaf.text.length > 0) break;
  }
}

function collectTextLeaves(node: RenderNode, out: RenderText[]): void {
  if (node.kind === 'text') {
    out.push(node);
    return;
  }
  if (node.kind === 'element') {
    for (const c of node.children) collectTextLeaves(c, out);
  }
}

function isEmptyText(node: RenderNode): boolean {
  return (
    node.kind === 'text' && !node.preserveWhitespace && node.text.length === 0
  );
}
