import { describe, it, expect, vi } from 'vitest';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'docx contents' }),
  },
}));

import mammoth from 'mammoth';
import { extractDocx } from '../../src/extraction/docxExtract.js';

describe('extractDocx', () => {
  it('delegates to mammoth.extractRawText and returns its value', async () => {
    const text = await extractDocx('/tmp/fake.docx');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ path: '/tmp/fake.docx' });
    expect(text).toBe('docx contents');
  });
});
