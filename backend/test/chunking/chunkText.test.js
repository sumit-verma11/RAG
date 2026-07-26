import { describe, it, expect } from 'vitest';
import { chunkText } from '../../src/chunking/chunkText.js';

describe('chunkText', () => {
  it('returns an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns a single chunk when text is shorter than chunkSize', () => {
    const chunks = chunkText('one two three', { chunkSize: 500, overlap: 50 });
    expect(chunks).toEqual([{ index: 0, content: 'one two three' }]);
  });

  it('splits long text into overlapping chunks', () => {
    const words = Array.from({ length: 120 }, (_, i) => `w${i}`);
    const chunks = chunkText(words.join(' '), { chunkSize: 50, overlap: 10 });
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content.split(' ')).toHaveLength(50);
    expect(chunks[0].content.split(' ').slice(-10)).toEqual(chunks[1].content.split(' ').slice(0, 10));
    expect(chunks[2].content.split(' ').at(-1)).toBe('w119');
  });
});
