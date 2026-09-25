import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProductAccordion } from './ProductAccordion';

describe('ProductAccordion Component', () => {
  it('renders all 6 progressive disclosure sections and expands Description by default', () => {
    render(
      <ProductAccordion
        description="Bespoke artisanal hijab crafted in Bangalore."
        materials="Pure organic modal with gold plating."
      />
    );

    // Section triggers
    expect(screen.getByText(/Description & Design Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Materials & Craftsmanship/i)).toBeInTheDocument();
    expect(screen.getByText(/Size & Fit Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Care & Longevity/i)).toBeInTheDocument();
    expect(screen.getByText(/Shipping & 7-Day Returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Reviews/i)).toBeInTheDocument();

    // Description content visible by default
    expect(screen.getByText('Bespoke artisanal hijab crafted in Bangalore.')).toBeInTheDocument();
  });

  it('allows toggling between metric and imperial in Size Guide section', () => {
    render(<ProductAccordion />);

    // Expand Size Guide
    const sizeGuideTrigger = screen.getByText(/Size & Fit Guide/i);
    fireEvent.click(sizeGuideTrigger);

    // Look for cm and in buttons
    const inButton = screen.getByRole('button', { name: 'in' });
    const cmButton = screen.getByRole('button', { name: 'cm' });

    expect(inButton).toBeInTheDocument();
    expect(cmButton).toBeInTheDocument();

    // Toggle to inches
    fireEvent.click(inButton);
    expect(screen.getAllByText('33″').length).toBeGreaterThanOrEqual(1);

    // Toggle back to cm
    fireEvent.click(cmButton);
    expect(screen.getAllByText('84 cm').length).toBeGreaterThanOrEqual(1);
  });

  it('renders customer reviews breakdown and expands more reviews on button click', () => {
    render(<ProductAccordion />);

    // Expand Reviews
    const reviewsTrigger = screen.getByText(/Customer Reviews/i);
    fireEvent.click(reviewsTrigger);

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('Based on 42 verified reviews')).toBeInTheDocument();
    expect(screen.getByText('Amina K.')).toBeInTheDocument();

    // Show more reviews button
    const showMoreBtn = screen.getByRole('button', { name: /Show More Reviews/i });
    expect(showMoreBtn).toBeInTheDocument();
    fireEvent.click(showMoreBtn);

    expect(screen.getByText('Farida S.')).toBeInTheDocument();
  });
});
