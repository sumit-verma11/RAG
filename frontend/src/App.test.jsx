import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the heading, upload input, and chat form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/upload a document/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });
});
