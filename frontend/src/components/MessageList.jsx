import { MarkdownLite } from './MarkdownLite';
import { SourceCitations } from './SourceCitations';

export function MessageList({ messages }) {
  return (
    <ul className="message-list">
      {messages.map((m, i) => (
        <li key={i} className={`message message-${m.role}`}>
          {m.role === 'assistant' ? <MarkdownLite text={m.content} /> : <p>{m.content}</p>}
          {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
            <details className="sources-toggle">
              <summary>{m.sources.length === 1 ? '1 source' : `${m.sources.length} sources`}</summary>
              <SourceCitations sources={m.sources} />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
