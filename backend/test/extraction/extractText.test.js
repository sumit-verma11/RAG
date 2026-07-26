import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/extraction/plainTextExtract.js', () => ({
  extractPlainText: vi.fn().mockResolvedValue('txt'),
}));
vi.mock('../../src/extraction/docxExtract.js', () => ({
  extractDocx: vi.fn().mockResolvedValue('docx'),
}));
vi.mock('../../src/extraction/pdfExtract.js', () => ({
  extractPdf: vi.fn().mockResolvedValue('pdf'),
}));

import { extractText } from '../../src/extraction/extractText.js';

describe('extractText', () => {
  it('routes .txt to extractPlainText', async () => {
    expect(await extractText('/tmp/a.txt', 'a.txt')).toBe('txt');
  });

  it('routes .md to extractPlainText', async () => {
    expect(await extractText('/tmp/a.md', 'a.md')).toBe('txt');
  });

  it('routes .docx to extractDocx', async () => {
    expect(await extractText('/tmp/a.docx', 'a.docx')).toBe('docx');
  });

  it('routes .pdf to extractPdf', async () => {
    expect(await extractText('/tmp/a.pdf', 'a.pdf')).toBe('pdf');
  });

  it('throws for unsupported extensions', async () => {
    await expect(extractText('/tmp/a.exe', 'a.exe')).rejects.toThrow('Unsupported file type: .exe');
  });
});
