import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownLite } from './MarkdownLite';

describe('MarkdownLite', () => {
  it('renders plain text with no markdown as a single paragraph', () => {
    render(<MarkdownLite text="Paris [1]" />);
    expect(screen.getByText('Paris [1]')).toBeInTheDocument();
  });

  it('renders **bold** segments as strong elements', () => {
    render(<MarkdownLite text="**Languages:** JavaScript, Python" />);
    expect(screen.getByText('Languages:').tagName).toBe('STRONG');
    expect(screen.getByText(/JavaScript, Python/)).toBeInTheDocument();
  });

  it('renders bullet lines as a list', () => {
    render(<MarkdownLite text={'* First point\n* Second point'} />);
    const list = screen.getByText('First point').closest('ul');
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Second point').closest('ul')).toBe(list);
  });

  it('renders numbered lines as an ordered list', () => {
    render(<MarkdownLite text={'1. Step one\n2. Step two'} />);
    expect(screen.getByText('Step one').closest('ol')).toBeInTheDocument();
  });

  it('renders separate non-list lines as separate paragraphs', () => {
    render(<MarkdownLite text={'First paragraph\nSecond paragraph'} />);
    const first = screen.getByText('First paragraph');
    const second = screen.getByText('Second paragraph');
    expect(first.tagName).toBe('P');
    expect(second.tagName).toBe('P');
    expect(first).not.toBe(second);
  });
});
