export function chunkText(text, { chunkSize = 500, overlap = 50 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  const step = chunkSize - overlap;
  let start = 0;
  let index = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push({ index, content: words.slice(start, end).join(' ') });
    index += 1;
    if (end === words.length) break;
    start += step;
  }

  return chunks;
}
