import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/client', () => ({ uploadDocument: vi.fn() }));

import { uploadDocument } from '../api/client';
import { UploadPanel } from './UploadPanel';

describe('UploadPanel', () => {
  it('shows a loading state then a success state on upload', async () => {
    uploadDocument.mockResolvedValue({ filename: 'a.txt', chunksIndexed: 2 });
    render(<UploadPanel />);

    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload a document/i), { target: { files: [file] } });

    expect(await screen.findByText(/document indexed/i)).toBeInTheDocument();
  });

  it('shows an error message when upload fails', async () => {
    uploadDocument.mockRejectedValue(new Error('bad upload'));
    render(<UploadPanel />);

    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload a document/i), { target: { files: [file] } });

    expect(await screen.findByText('bad upload')).toBeInTheDocument();
  });
});
