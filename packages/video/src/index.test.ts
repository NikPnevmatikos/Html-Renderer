import { createVideoRenderers } from './index';

// Scaffold smoke test — replaced by real coverage when the factory lands.
describe('createVideoRenderers (scaffold)', () => {
  it('exports the factory and reports unimplemented for now', () => {
    expect(typeof createVideoRenderers).toBe('function');
    expect(() => createVideoRenderers((() => null) as never)).toThrow(
      /not implemented/i,
    );
  });
});
