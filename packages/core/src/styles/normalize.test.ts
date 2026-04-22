import { normalizeStyleInput, normalizeStyleMap } from './normalize';

describe('normalizeStyleInput', () => {
  it('returns object inputs unchanged', () => {
    const input = { color: 'red', fontSize: 20 };
    expect(normalizeStyleInput(input)).toEqual(input);
  });

  it('parses CSS declaration strings', () => {
    expect(normalizeStyleInput('color: red; font-size: 20px')).toEqual({
      color: 'red',
      fontSize: 20,
    });
  });

  it('returns empty object for empty string', () => {
    expect(normalizeStyleInput('')).toEqual({});
  });
});

describe('normalizeStyleMap', () => {
  it('returns empty object for undefined', () => {
    expect(normalizeStyleMap(undefined)).toEqual({});
  });

  it('normalizes a mix of object and string values', () => {
    const out = normalizeStyleMap({
      h1: { color: 'red' },
      h2: 'color: blue; font-size: 18px',
    });
    expect(out).toEqual({
      h1: { color: 'red' },
      h2: { color: 'blue', fontSize: 18 },
    });
  });
});
