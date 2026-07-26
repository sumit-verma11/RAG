import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageList } from './MessageList';

describe('MessageList', () => {
  it('renders user and assistant messages with citations', () => {
    render(
      <MessageList
        messages={[
          { role: 'user', content: 'capital of France?' },
          { role: 'assistant', content: 'Paris [1]', sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }] },
        ]}
      />
    );
    expect(screen.getByText('capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Paris [1]')).toBeInTheDocument();
    expect(screen.getByText(/geo\.txt/)).toBeInTheDocument();
  });
});
