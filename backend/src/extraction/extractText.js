import path from 'node:path';
import { extractPlainText } from './plainTextExtract.js';
import { extractDocx } from './docxExtract.js';
import { extractPdf } from './pdfExtract.js';

export async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.txt' || ext === '.md') return extractPlainText(filePath);
  if (ext === '.docx') return extractDocx(filePath);
  if (ext === '.pdf') return extractPdf(filePath);
  throw new Error(`Unsupported file type: ${ext}`);
}
