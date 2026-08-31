import type { RenderElement, RenderNode } from '../types';

export interface DetailsParts {
  summary: RenderElement | null;
  rest: RenderNode[];
}

// Per the HTML spec, only the first <summary> element child is the disclosure
// label; any further <summary> elements are ordinary content (browsers render
// them inside the collapsible body).
export function splitDetailsChildren(children: RenderNode[]): DetailsParts {
  let summary: RenderElement | null = null;
  const rest: RenderNode[] = [];
  for (const child of children) {
    if (
      summary === null &&
      child.kind === 'element' &&
      child.tag === 'summary'
    ) {
      summary = child;
      continue;
    }
    rest.push(child);
  }
  return { summary, rest };
}
