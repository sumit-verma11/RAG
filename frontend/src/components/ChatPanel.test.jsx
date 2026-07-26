import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/client', () => ({ sendQuery: vi.fn() }));

import { sendQuery } from '../api/client';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel', () => {
  it('submits a question and renders the answer with sources', async () => {
    sendQuery.mockResolvedValue({
      answer: 'Paris [1]',
      sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }],
    });

    render(<ChatPanel />);
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'capital of France?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('capital of France?')).toBeInTheDocument();
    expect(await screen.findByText('Paris [1]')).toBeInTheDocument();
  });

  it('shows an error message when the query fails', async () => {
    sendQuery.mockRejectedValue(new Error('bad query'));

    render(<ChatPanel />);
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'capital of France?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('bad query')).toBeInTheDocument();
  });
});
