import { parseInlineStyle } from './parse-inline';

describe('parseInlineStyle', () => {
  it('returns empty for undefined', () => {
    expect(parseInlineStyle(undefined)).toEqual({});
  });

  it('parses a single property', () => {
    expect(parseInlineStyle('color: red')).toEqual({ color: 'red' });
  });

  it('parses multiple properties', () => {
    expect(parseInlineStyle('color: red; font-size: 16px')).toEqual({
      color: 'red',
      fontSize: 16,
    });
  });

  it('handles trailing semicolon and whitespace', () => {
    expect(parseInlineStyle('  color : red ;  ')).toEqual({ color: 'red' });
  });

  it('parses font-size in px', () => {
    expect(parseInlineStyle('font-size: 20px')).toEqual({ fontSize: 20 });
  });

  it('parses font-size without unit', () => {
    expect(parseInlineStyle('font-size: 12')).toEqual({ fontSize: 12 });
  });

  it('parses font-weight keyword and numeric', () => {
    expect(parseInlineStyle('font-weight: bold')).toEqual({
      fontWeight: 'bold',
    });
    expect(parseInlineStyle('font-weight: 700')).toEqual({ fontWeight: 'bold' });
    expect(parseInlineStyle('font-weight: 400')).toEqual({
      fontWeight: 'normal',
    });
  });

  it('parses text-decoration combinations', () => {
    expect(parseInlineStyle('text-decoration: underline')).toEqual({
      textDecorationLine: 'underline',
    });
    expect(
      parseInlineStyle('text-decoration: underline line-through'),
    ).toEqual({ textDecorationLine: 'underline line-through' });
    expect(parseInlineStyle('text-decoration: none')).toEqual({
      textDecorationLine: 'none',
    });
  });

  it('parses margin shorthand 1-value', () => {
    expect(parseInlineStyle('margin: 10px')).toEqual({
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    });
  });

  it('parses margin shorthand 2-value', () => {
    expect(parseInlineStyle('margin: 10px 20px')).toEqual({
      marginTop: 10,
      marginRight: 20,
      marginBottom: 10,
      marginLeft: 20,
    });
  });

  it('parses margin shorthand 4-value', () => {
    expect(parseInlineStyle('margin: 1px 2px 3px 4px')).toEqual({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 4,
    });
  });

  it('parses padding individual sides', () => {
    expect(parseInlineStyle('padding-left: 5px')).toEqual({ paddingLeft: 5 });
  });

  it('parses background-color', () => {
    expect(parseInlineStyle('background-color: #fff')).toEqual({
      backgroundColor: '#fff',
    });
  });

  it('parses font-family with quotes', () => {
    expect(parseInlineStyle('font-family: "Courier New", monospace')).toEqual({
      fontFamily: 'Courier New',
    });
  });

  it('ignores unknown properties', () => {
    expect(parseInlineStyle('transform: rotate(45deg)')).toEqual({});
  });

  it('ignores malformed declarations', () => {
    expect(parseInlineStyle('no-colon-here; color: red')).toEqual({
      color: 'red',
    });
  });
});
