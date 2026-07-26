import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/embeddings/geminiEmbeddings.js', () => ({ embedTexts: vi.fn() }));
vi.mock('../../src/vectorstore/documentsStore.js', () => ({ matchDocuments: vi.fn() }));
vi.mock('../../src/chat/geminiChat.js', () => ({ generateAnswer: vi.fn() }));

import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';
import { matchDocuments } from '../../src/vectorstore/documentsStore.js';
import { generateAnswer } from '../../src/chat/geminiChat.js';
import app from '../../src/app.js';

describe('POST /api/query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when question is missing', async () => {
    const res = await request(app).post('/api/query').send({});
    expect(res.status).toBe(400);
  });

  it('returns an answer with sources for a matched question', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([
      { source_filename: 'geo.txt', chunk_index: 0, content: 'Paris is the capital of France.', similarity: 0.9 },
    ]);
    generateAnswer.mockResolvedValue('Paris [1]');

    const res = await request(app).post('/api/query').send({ question: 'capital of France?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      answer: 'Paris [1]',
      sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }],
    });
  });

  it('returns the "I don\'t know" answer when no chunks match', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([]);

    const res = await request(app).post('/api/query').send({ question: 'anything?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ answer: "I don't know based on the provided documents.", sources: [] });
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it('clamps an out-of-range k to the maximum instead of passing it straight through', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([]);

    await request(app).post('/api/query').send({ question: 'anything?', k: 999999 });

    expect(matchDocuments).toHaveBeenCalledWith([0.1], 20);
  });

  it('falls back to the default k for a non-numeric or negative value', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([]);

    await request(app).post('/api/query').send({ question: 'anything?', k: -5 });

    expect(matchDocuments).toHaveBeenCalledWith([0.1], 5);
  });
});
