import { splitDetailsChildren } from './details';
import { parseHtml } from '../parser/parse';
import { buildRenderTree } from '../render-tree/build';
import type { RenderElement, RenderText } from '../types';

function detailsChildren(html: string) {
  const tree = buildRenderTree(parseHtml(html));
  return (tree[0] as RenderElement).children;
}

describe('splitDetailsChildren', () => {
  it('takes the first summary as label and the rest as content', () => {
    const { summary, rest } = splitDetailsChildren(
      detailsChildren(
        '<details><summary>More</summary><p>body</p><div>extra</div></details>',
      ),
    );
    expect(summary?.tag).toBe('summary');
    expect((summary?.children[0] as RenderText).text).toBe('More');
    expect(rest.map((n) => (n as RenderElement).tag)).toEqual(['p', 'div']);
  });

  it('treats additional summary elements as content', () => {
    const { summary, rest } = splitDetailsChildren(
      detailsChildren(
        '<details><summary>first</summary><summary>second</summary></details>',
      ),
    );
    expect((summary?.children[0] as RenderText).text).toBe('first');
    expect(rest).toHaveLength(1);
    expect((rest[0] as RenderElement).tag).toBe('summary');
  });

  it('finds the summary even when it is not the first child', () => {
    const { summary, rest } = splitDetailsChildren(
      detailsChildren(
        '<details><p>before</p><summary>label</summary><p>after</p></details>',
      ),
    );
    expect((summary?.children[0] as RenderText).text).toBe('label');
    expect(rest.map((n) => (n as RenderElement).tag)).toEqual(['p', 'p']);
  });

  it('returns null summary when none is present', () => {
    const { summary, rest } = splitDetailsChildren(
      detailsChildren('<details><p>only content</p></details>'),
    );
    expect(summary).toBeNull();
    expect(rest).toHaveLength(1);
  });
});
