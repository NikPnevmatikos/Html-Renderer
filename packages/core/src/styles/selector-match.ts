import type { Selector, SelectorPart } from './css-parser';

export interface ElementInfo {
  tag: string;
  classes: string[];
  id: string | null;
}

export function matchSelector(
  selector: Selector,
  element: ElementInfo,
  ancestors: ElementInfo[],
): boolean {
  const parts = selector.parts;
  if (parts.length === 0) return false;

  if (!matchPart(parts[parts.length - 1]!, element)) return false;

  let partIdx = parts.length - 2;
  let ancIdx = ancestors.length - 1;

  while (partIdx >= 0) {
    const part = parts[partIdx]!;
    const rightPart = parts[partIdx + 1]!;
    if (rightPart.combinator === 'child') {
      if (ancIdx < 0) return false;
      if (!matchPart(part, ancestors[ancIdx]!)) return false;
      ancIdx--;
    } else {
      let found = false;
      while (ancIdx >= 0) {
        if (matchPart(part, ancestors[ancIdx]!)) {
          found = true;
          ancIdx--;
          break;
        }
        ancIdx--;
      }
      if (!found) return false;
    }
    partIdx--;
  }

  return true;
}

function matchPart(part: SelectorPart, el: ElementInfo): boolean {
  if (part.tag && part.tag !== el.tag) return false;
  for (const cls of part.classes) {
    if (!el.classes.includes(cls)) return false;
  }
  for (const id of part.ids) {
    if (el.id !== id) return false;
  }
  return true;
}
