import type { RenderNode, RenderElement } from '../types';

export function hoistBlocks(nodes: RenderNode[]): RenderNode[] {
  const out: RenderNode[] = [];
  for (const node of nodes) {
    if (node.kind !== 'element') {
      out.push(node);
      continue;
    }

    const newChildren = hoistBlocks(node.children);

    if (node.display === 'inline' && containsBreaking(newChildren)) {
      out.push(...fragmentInline(node, newChildren));
      continue;
    }

    out.push({ ...node, children: newChildren });
  }
  return out;
}

function containsBreaking(nodes: RenderNode[]): boolean {
  for (const n of nodes) {
    if (n.kind === 'image') return true;
    if (n.kind === 'element' && n.display === 'block') return true;
  }
  return false;
}

function fragmentInline(
  inline: RenderElement,
  children: RenderNode[],
): RenderNode[] {
  const result: RenderNode[] = [];
  let currentInlineChildren: RenderNode[] = [];

  const flushInline = () => {
    if (currentInlineChildren.length > 0) {
      result.push({ ...inline, children: currentInlineChildren });
      currentInlineChildren = [];
    }
  };

  for (const c of children) {
    const isBreaking =
      c.kind === 'image' || (c.kind === 'element' && c.display === 'block');
    if (isBreaking) {
      flushInline();
      result.push(c);
    } else {
      currentInlineChildren.push(c);
    }
  }
  flushInline();

  return result;
}
