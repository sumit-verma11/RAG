import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockBatchEmbedContents, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockBatchEmbedContents = vi.fn();
  const mockGetGenerativeModel = vi.fn().mockReturnValue({ batchEmbedContents: mockBatchEmbedContents });
  return { mockBatchEmbedContents, mockGetGenerativeModel };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel: mockGetGenerativeModel };
  }),
}));

import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';

function embeddingsResult(count) {
  return { embeddings: Array.from({ length: count }, (_, i) => ({ values: [i] })) };
}

describe('embedTexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('embeds a small batch in a single call', async () => {
    mockBatchEmbedContents.mockResolvedValue(embeddingsResult(3));
    const vectors = await embedTexts(['a', 'b', 'c']);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(1);
    expect(vectors).toEqual([[0], [1], [2]]);
  });

  it('splits more than 20 texts into multiple batch calls', async () => {
    mockBatchEmbedContents
      .mockResolvedValueOnce(embeddingsResult(20))
      .mockResolvedValueOnce(embeddingsResult(5));
    const texts = Array.from({ length: 25 }, (_, i) => `text-${i}`);
    const vectors = await embedTexts(texts);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(2);
    expect(vectors).toHaveLength(25);
  });

  it('retries on rate-limit errors then succeeds', async () => {
    mockBatchEmbedContents
      .mockRejectedValueOnce({ status: 429, message: 'rate limit' })
      .mockResolvedValueOnce(embeddingsResult(1));
    const vectors = await embedTexts(['a']);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(2);
    expect(vectors).toEqual([[0]]);
  });

  it('does not retry non-rate-limit errors', async () => {
    mockBatchEmbedContents.mockRejectedValue(new Error('boom'));
    await expect(embedTexts(['a'])).rejects.toThrow('boom');
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(1);
  });
});
