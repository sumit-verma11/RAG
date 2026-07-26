import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPage, mockPdf } = vi.hoisted(() => {
  const mockPage = {
    getTextContent: vi.fn(),
    getViewport: vi.fn().mockReturnValue({ width: 10, height: 10 }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
  };

  const mockPdf = {
    numPages: 1,
    getPage: vi.fn().mockResolvedValue(mockPage),
  };

  return { mockPage, mockPdf };
});

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-pdf-bytes')),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn().mockReturnValue({ promise: Promise.resolve(mockPdf) }),
}));

vi.mock('canvas', () => ({
  createCanvas: vi.fn().mockReturnValue({
    getContext: vi.fn().mockReturnValue({}),
    toBuffer: vi.fn().mockReturnValue(Buffer.from('fake-png')),
  }),
}));

vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn().mockResolvedValue({ data: { text: 'ocr text' } }) },
}));

import Tesseract from 'tesseract.js';
import { extractPdf } from '../../src/extraction/pdfExtract.js';

describe('extractPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the text layer when it is non-empty', async () => {
    mockPage.getTextContent.mockResolvedValue({ items: [{ str: 'real text' }] });
    const text = await extractPdf('/tmp/fake.pdf');
    expect(text).toContain('real text');
    expect(Tesseract.recognize).not.toHaveBeenCalled();
  });

  it('falls back to OCR when the text layer is empty', async () => {
    mockPage.getTextContent.mockResolvedValue({ items: [] });
    const text = await extractPdf('/tmp/fake.pdf');
    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(text).toContain('ocr text');
  });
});
