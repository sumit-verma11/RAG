import { describe, it, expect } from 'vitest';
import { filterCitedSources } from '../../src/chat/citations.js';

const chunks = [
  { source_filename: 'a.txt', chunk_index: 0, similarity: 0.9 },
  { source_filename: 'b.txt', chunk_index: 0, similarity: 0.6 },
  { source_filename: 'c.txt', chunk_index: 0, similarity: 0.4 },
];

describe('filterCitedSources', () => {
  it('keeps only the cited source when a single citation is used', () => {
    const result = filterCitedSources('Paris [1]', chunks);
    expect(result.answer).toBe('Paris [1]');
    expect(result.sources).toEqual([{ filename: 'a.txt', chunkIndex: 0, similarity: 0.9 }]);
  });

  it('drops uncited chunks even though they were retrieved', () => {
    const result = filterCitedSources('The answer is here [1].', chunks);
    expect(result.sources).toEqual([{ filename: 'a.txt', chunkIndex: 0, similarity: 0.9 }]);
  });

  it('renumbers citations sequentially and rewrites the answer text to match', () => {
    const result = filterCitedSources('Combining [1] and [3].', chunks);
    expect(result.answer).toBe('Combining [1] and [2].');
    expect(result.sources).toEqual([
      { filename: 'a.txt', chunkIndex: 0, similarity: 0.9 },
      { filename: 'c.txt', chunkIndex: 0, similarity: 0.4 },
    ]);
  });

  it('deduplicates repeated citations of the same source', () => {
    const result = filterCitedSources('[2] says X, and [2] also says Y.', chunks);
    expect(result.answer).toBe('[1] says X, and [1] also says Y.');
    expect(result.sources).toEqual([{ filename: 'b.txt', chunkIndex: 0, similarity: 0.6 }]);
  });

  it('returns no sources when the answer contains no citation markers', () => {
    const result = filterCitedSources("I don't know based on the provided documents.", chunks);
    expect(result.sources).toEqual([]);
  });

  it('ignores out-of-range citation numbers', () => {
    const result = filterCitedSources('See [1] and [99].', chunks);
    expect(result.answer).toBe('See [1] and [99].');
    expect(result.sources).toEqual([{ filename: 'a.txt', chunkIndex: 0, similarity: 0.9 }]);
  });
});
