import { readFile } from 'node:fs/promises';

export async function extractPlainText(filePath) {
  return readFile(filePath, 'utf-8');
}
