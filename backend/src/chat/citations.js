export function filterCitedSources(answer, chunks) {
  const cited = [...answer.matchAll(/\[(\d+)\]/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n >= 1 && n <= chunks.length);
  const uniqueSorted = [...new Set(cited)].sort((a, b) => a - b);

  if (uniqueSorted.length === 0) {
    return { answer, sources: [] };
  }

  const renumber = new Map(uniqueSorted.map((orig, idx) => [orig, idx + 1]));
  const rewrittenAnswer = answer.replace(/\[(\d+)\]/g, (match, numStr) => {
    const newNumber = renumber.get(Number(numStr));
    return newNumber ? `[${newNumber}]` : match;
  });

  const sources = uniqueSorted.map((orig) => {
    const chunk = chunks[orig - 1];
    return {
      filename: chunk.source_filename,
      chunkIndex: chunk.chunk_index,
      similarity: chunk.similarity,
    };
  });

  return { answer: rewrittenAnswer, sources };
}
