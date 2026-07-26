import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageList } from './MessageList';

describe('MessageList', () => {
  it('renders user and assistant messages, with sources collapsed behind a toggle', () => {
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

    const toggle = screen.getByText('1 source');
    expect(screen.queryByText(/geo\.txt/)).not.toBeVisible();

    fireEvent.click(toggle);
    expect(screen.getByText(/geo\.txt/)).toBeVisible();
  });

  it('renders no toggle when there are no sources', () => {
    render(<MessageList messages={[{ role: 'assistant', content: "I don't know.", sources: [] }]} />);
    expect(screen.queryByText(/source/i)).not.toBeInTheDocument();
  });
});
