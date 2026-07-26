import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/extraction/extractText.js', () => ({ extractText: vi.fn() }));
vi.mock('../../src/chunking/chunkText.js', () => ({ chunkText: vi.fn() }));
vi.mock('../../src/embeddings/geminiEmbeddings.js', () => ({ embedTexts: vi.fn() }));
vi.mock('../../src/vectorstore/documentsStore.js', () => ({ insertChunks: vi.fn() }));

import { extractText } from '../../src/extraction/extractText.js';
import { chunkText } from '../../src/chunking/chunkText.js';
import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';
import { insertChunks } from '../../src/vectorstore/documentsStore.js';
import app from '../../src/app.js';

describe('POST /api/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/ingest');
    expect(res.status).toBe(400);
  });

  it('extracts, chunks, embeds, and stores the uploaded file', async () => {
    extractText.mockResolvedValue('hello world');
    chunkText.mockReturnValue([{ index: 0, content: 'hello world' }]);
    embedTexts.mockResolvedValue([[0.1, 0.2]]);
    insertChunks.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('hello world'), 'notes.txt');

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ filename: 'notes.txt', chunksIndexed: 1 });
    expect(insertChunks).toHaveBeenCalledWith([
      { source_filename: 'notes.txt', chunk_index: 0, content: 'hello world', embedding: [0.1, 0.2] },
    ]);
  });

  it('returns 422 when no chunks are produced', async () => {
    extractText.mockResolvedValue('');
    chunkText.mockReturnValue([]);

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from(''), 'empty.txt');

    expect(res.status).toBe(422);
  });

  it('returns 500 with a generic message when extraction throws', async () => {
    extractText.mockRejectedValue(new Error('some internal detail that should not leak'));

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('x'), 'broken.txt');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('returns 400 for an unsupported file extension', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('x'), 'malware.exe');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported file type/i);
  });

  it('returns 413 when the file exceeds the size limit', async () => {
    const oversized = Buffer.alloc(15 * 1024 * 1024 + 1);

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', oversized, 'big.txt');

    expect(res.status).toBe(413);
  });
});
