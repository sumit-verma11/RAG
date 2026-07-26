import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { extractPlainText } from '../../src/extraction/plainTextExtract.js';

const tmpPath = './test/extraction/fixture.txt';

describe('extractPlainText', () => {
  afterEach(async () => {
    await unlink(tmpPath).catch(() => {});
  });

  it('returns the raw file contents', async () => {
    await writeFile(tmpPath, 'hello world');
    const text = await extractPlainText(tmpPath);
    expect(text).toBe('hello world');
  });
});
