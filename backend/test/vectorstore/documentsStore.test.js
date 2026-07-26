import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockFrom: vi.fn(),
  mockRpc: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: mockFrom, rpc: mockRpc }),
}));

mockFrom.mockReturnValue({ insert: mockInsert });

import { insertChunks, matchDocuments } from '../../src/vectorstore/documentsStore.js';

describe('documentsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: [{ id: 1 }], error: null });
  });

  it('insertChunks inserts rows into the documents table', async () => {
    const rows = [{ source_filename: 'a.txt', chunk_index: 0, content: 'hi', embedding: [0.1] }];
    await insertChunks(rows);
    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(mockInsert).toHaveBeenCalledWith(rows);
  });

  it('insertChunks throws when supabase returns an error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'boom' } });
    await expect(insertChunks([])).rejects.toThrow('Supabase insert failed: boom');
  });

  it('matchDocuments calls the match_documents rpc and returns data', async () => {
    const result = await matchDocuments([0.1, 0.2], 3);
    expect(mockRpc).toHaveBeenCalledWith('match_documents', { query_embedding: [0.1, 0.2], match_count: 3 });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('matchDocuments throws when supabase returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(matchDocuments([0.1])).rejects.toThrow('Supabase match_documents failed: boom');
  });
});
