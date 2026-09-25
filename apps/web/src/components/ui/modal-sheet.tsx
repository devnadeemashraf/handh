'use client';

import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';

const ModalSheet = DialogPrimitive.Root;
const ModalSheetTrigger = DialogPrimitive.Trigger;
const ModalSheetClose = DialogPrimitive.Close;
const ModalSheetPortal = DialogPrimitive.Portal;

const ModalSheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-scrim transition-opacity duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 select-none',
      className
    )}
    {...props}
  />
));
ModalSheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface ModalSheetContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  showCloseButton?: boolean;
}

const ModalSheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ModalSheetContentProps
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <ModalSheetPortal>
    <ModalSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Mobile: Bottom Sheet (anchored to bottom edge, full width, rounded top corners)
        'fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-md bg-surface p-6 shadow-elevation-2 border-t border-border-subtle transition-all ease-decelerate duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        // Desktop / Tablet (>=768px): Centered Modal
        'md:inset-auto md:left-[50%] md:top-[50%] md:bottom-auto md:max-w-lg md:w-full md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-md md:border md:border-border-subtle md:slide-in-from-bottom-0 md:zoom-in-95 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    >
      {/* Mobile drag handle */}
      <div
        className="mx-auto -mt-2 mb-4 h-1 w-8 rounded-full bg-border-strong md:hidden"
        aria-hidden="true"
      />
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-royal focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalSheetPortal>
));
ModalSheetContent.displayName = DialogPrimitive.Content.displayName;

const ModalSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />
);
ModalSheetHeader.displayName = 'ModalSheetHeader';

const ModalSheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 mt-4 border-t border-border-subtle',
      className
    )}
    {...props}
  />
);
ModalSheetFooter.displayName = 'ModalSheetFooter';

const ModalSheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-serif text-lg font-medium text-text-primary leading-none', className)}
    {...props}
  />
));
ModalSheetTitle.displayName = DialogPrimitive.Title.displayName;

const ModalSheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-secondary mt-1', className)}
    {...props}
  />
));
ModalSheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  ModalSheet,
  ModalSheetClose,
  ModalSheetContent,
  ModalSheetDescription,
  ModalSheetFooter,
  ModalSheetHeader,
  ModalSheetOverlay,
  ModalSheetPortal,
  ModalSheetTitle,
  ModalSheetTrigger
};
