import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SourceCitations } from './SourceCitations';

describe('SourceCitations', () => {
  it('renders nothing when there are no sources', () => {
    const { container } = render(<SourceCitations sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a numbered entry per source', () => {
    render(<SourceCitations sources={[{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.87 }]} />);
    expect(screen.getByText(/geo\.txt/)).toBeInTheDocument();
    expect(screen.getByText(/0\.87/)).toBeInTheDocument();
  });
});
