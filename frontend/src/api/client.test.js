import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocument, sendQuery } from './client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('uploadDocument', () => {
  it('posts the file as form data and returns the parsed body', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ filename: 'a.txt', chunksIndexed: 2 }) });
    const file = new File(['hi'], 'a.txt');
    const result = await uploadDocument(file);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/ingest'), expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual({ filename: 'a.txt', chunksIndexed: 2 });
  });

  it('throws the server error message on failure', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'bad upload' }) });
    await expect(uploadDocument(new File(['x'], 'a.txt'))).rejects.toThrow('bad upload');
  });
});

describe('sendQuery', () => {
  it('posts the question as json and returns the parsed body', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ answer: 'hi', sources: [] }) });
    const result = await sendQuery('what?');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/query'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ question: 'what?' }) })
    );
    expect(result).toEqual({ answer: 'hi', sources: [] });
  });

  it('throws the server error message on failure', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'bad query' }) });
    await expect(sendQuery('what?')).rejects.toThrow('bad query');
  });
});
