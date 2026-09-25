import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Alert } from './alert';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import {
  ModalSheet,
  ModalSheetContent,
  ModalSheetHeader,
  ModalSheetTitle,
  ModalSheetTrigger
} from './modal-sheet';
import { Skeleton } from './skeleton';
import { ToastProvider, useToast } from './toast';

describe('Design System Primitives (Sprint 11.1)', () => {
  describe('Button Primitive', () => {
    it('renders primary royal variant by default with 44px minimum height', () => {
      render(<Button>Shop Collection</Button>);
      const btn = screen.getByRole('button', { name: /shop collection/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-royal');
      expect(btn.className).toContain('min-h-[44px]');
      expect(btn.className).toContain('rounded-sm');
    });

    it('renders secondary variant with hairline border-strong', () => {
      render(<Button variant="secondary">View Cart</Button>);
      const btn = screen.getByRole('button', { name: /view cart/i });
      expect(btn.className).toContain('border-border-strong');
      expect(btn.className).toContain('bg-transparent');
    });

    it('renders loading state with spinner and disables button', () => {
      render(<Button loading>Processing</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      // SVG spinner should be present
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });

    it('renders sm size with min 44px touch target compliance', () => {
      render(<Button size="sm">Edit</Button>);
      const btn = screen.getByRole('button', { name: /edit/i });
      expect(btn.className).toContain('min-w-[44px]');
      expect(btn.className).toContain('min-h-[36px]');
    });
  });

  describe('Input Primitive', () => {
    it('renders input with 44px height and 2px radius', () => {
      render(<Input placeholder="Enter email" />);
      const input = screen.getByPlaceholderText('Enter email');
      expect(input.className).toContain('h-11');
      expect(input.className).toContain('rounded-sm');
      expect(input.className).toContain('border-border-subtle');
    });

    it('displays reserved error space and marks aria-invalid when error is provided', () => {
      render(<Input id="test-email" error="Please enter a valid email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-email-error');
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  describe('Badge Primitive', () => {
    it('renders new, sale, lowStock, and soldOut variants with uppercase tracking', () => {
      const { rerender } = render(<Badge variant="new">New Arrival</Badge>);
      let badge = screen.getByText('New Arrival');
      expect(badge.className).toContain('bg-royal-tint');
      expect(badge.className).toContain('uppercase');
      expect(badge.className).toContain('rounded-sm');

      rerender(<Badge variant="sale">Sale</Badge>);
      badge = screen.getByText('Sale');
      expect(badge.className).toContain('text-status-sale');

      rerender(<Badge variant="lowStock">Low Stock</Badge>);
      badge = screen.getByText('Low Stock');
      expect(badge.className).toContain('text-status-warning');

      rerender(<Badge variant="soldOut">Sold Out</Badge>);
      badge = screen.getByText('Sold Out');
      expect(badge.className).toContain('bg-sunken');
    });
  });

  describe('Alert Primitive', () => {
    it('renders semantic alerts with role="alert" and dismiss handler', async () => {
      const onDismiss = vi.fn();
      render(
        <Alert variant="info" onDismiss={onDismiss}>
          Free shipping on orders over ₹4,999
        </Alert>
      );
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.className).toContain('bg-royal-tint');

      const dismissBtn = screen.getByRole('button', { name: /dismiss alert/i });
      await userEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Notification System', () => {
    function TestToastConsumer() {
      const { toast } = useToast();
      return (
        <div>
          <button
            onClick={() =>
              toast({
                message: 'Added to your bag',
                variant: 'success',
                action: { label: 'View Bag', onClick: vi.fn() }
              })
            }
          >
            Trigger Toast
          </button>
        </div>
      );
    }

    it('enforces maximum 2 stacked toasts rule and renders action link', async () => {
      render(
        <ToastProvider>
          <TestToastConsumer />
        </ToastProvider>
      );

      const trigger = screen.getByText('Trigger Toast');

      // Click 3 times
      await userEvent.click(trigger);
      await userEvent.click(trigger);
      await userEvent.click(trigger);

      // Verify that at most 2 toasts exist
      const toastItems = screen.getAllByRole('status');
      expect(toastItems.length).toBeLessThanOrEqual(2);
      expect(screen.getAllByText('Added to your bag').length).toBeLessThanOrEqual(2);
      expect(screen.getAllByText('View Bag')[0]).toBeInTheDocument();
    });
  });

  describe('Skeleton Primitive', () => {
    it('renders with sunken background and shimmer animation', () => {
      render(<Skeleton data-testid="test-skeleton" className="h-40 w-full" />);
      const skeleton = screen.getByTestId('test-skeleton');
      expect(skeleton.className).toContain('bg-sunken');
      expect(skeleton.className).toContain('rounded-md');
      expect(skeleton.className).toContain('after:animate-shimmer');
    });
  });

  describe('ModalSheet Responsive Primitive', () => {
    it('renders modal/sheet trigger and opens content on click', async () => {
      render(
        <ModalSheet>
          <ModalSheetTrigger asChild>
            <Button>Open Sheet</Button>
          </ModalSheetTrigger>
          <ModalSheetContent>
            <ModalSheetHeader>
              <ModalSheetTitle>Select Size</ModalSheetTitle>
            </ModalSheetHeader>
            <div>Size Guide Options</div>
          </ModalSheetContent>
        </ModalSheet>
      );

      expect(screen.queryByText('Select Size')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /open sheet/i }));
      expect(screen.getByText('Select Size')).toBeInTheDocument();
      expect(screen.getByText('Size Guide Options')).toBeInTheDocument();
    });
  });
});
