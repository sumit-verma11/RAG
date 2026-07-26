import { useEffect, useRef, useState } from 'react';
import { sendQuery } from '../api/client';
import { MessageList } from './MessageList';
import './ChatPanel.css';

export function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setStatus('loading');
    setError(null);

    try {
      const { answer, sources } = await sendQuery(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="chat-panel card">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">Ask a question about your uploaded documents</p>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </div>
      {status === 'loading' && (
        <p role="status" className="status status-loading">Thinking...</p>
      )}
      {status === 'error' && (
        <p role="alert" className="status status-error">{error}</p>
      )}
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents"
          disabled={status === 'loading'}
          className="chat-input"
        />
        <button type="submit" disabled={status === 'loading'} className="chat-send">Send</button>
      </form>
    </div>
  );
}
