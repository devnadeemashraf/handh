import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DraftPreviewBanner } from './DraftPreviewBanner';

describe('DraftPreviewBanner Component', () => {
  it('renders preview indicator and exit link with default root path', () => {
    render(<DraftPreviewBanner />);

    expect(screen.getByRole('complementary', { name: /draft preview mode/i })).toBeInTheDocument();
    expect(screen.getByText(/draft preview mode active/i)).toBeInTheDocument();

    const exitLink = screen.getByRole('link', { name: /exit preview/i });
    expect(exitLink).toBeInTheDocument();
    expect(exitLink).toHaveAttribute('href', '/api/draft/disable?path=%2F');
  });

  it('renders exit link with custom exit path', () => {
    render(<DraftPreviewBanner exitPath="/products/royal-gold-pin" />);

    const exitLink = screen.getByRole('link', { name: /exit preview/i });
    expect(exitLink).toHaveAttribute(
      'href',
      '/api/draft/disable?path=%2Fproducts%2Froyal-gold-pin'
    );
  });
});
