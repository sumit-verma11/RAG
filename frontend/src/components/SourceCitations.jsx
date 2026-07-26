export function SourceCitations({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <ul className="source-citations">
      {sources.map((s, i) => (
        <li key={`${s.filename}-${s.chunkIndex}`}>
          [{i + 1}] {s.filename} · {Math.round(s.similarity * 100)}% match
        </li>
      ))}
    </ul>
  );
}
