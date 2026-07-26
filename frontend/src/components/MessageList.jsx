import { SourceCitations } from './SourceCitations';

export function MessageList({ messages }) {
  return (
    <ul className="message-list">
      {messages.map((m, i) => (
        <li key={i} className={`message message-${m.role}`}>
          <p>{m.content}</p>
          {m.role === 'assistant' && <SourceCitations sources={m.sources} />}
        </li>
      ))}
    </ul>
  );
}
