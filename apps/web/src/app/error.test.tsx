import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import RootError from './error';

describe('RootError Component (E-COM-147)', () => {
  const mockReset = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error boundary heading, digest, and recovery CTAs', () => {
    const testError = Object.assign(new Error('Test failure'), { digest: 'ERR-DIGEST-123' });

    render(<RootError error={testError} reset={mockReset} />);

    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Reference: ERR-DIGEST-123/i)).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    const returnHomeLink = screen.getByRole('link', { name: /return home/i });
    expect(returnHomeLink).toBeInTheDocument();
    expect(returnHomeLink).toHaveAttribute('href', '/');

    fireEvent.click(tryAgainBtn);
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
