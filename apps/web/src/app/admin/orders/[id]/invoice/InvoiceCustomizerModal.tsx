'use client';

import { AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { DEFAULT_BRAND_IDENTITY, type InvoiceTemplateConfig } from '@hh/domain';

interface InvoiceCustomizerModalProps {
  initialTemplate: InvoiceTemplateConfig;
  onSave: (updated: InvoiceTemplateConfig) => void;
  onClose: () => void;
}

export default function InvoiceCustomizerModal({
  initialTemplate,
  onSave,
  onClose
}: InvoiceCustomizerModalProps) {
  const [template, setTemplate] = useState<InvoiceTemplateConfig>(initialTemplate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/settings/invoice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update invoice settings');
      }

      setSuccess(true);
      onSave(data.template);
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-accent" />
            <DialogTitle className="font-serif text-xl">Customize Invoice Template</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Personalize brand details, tax identification, and custom messaging across all customer
            invoices.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Template saved and applied!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Brand Name & Legal Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-accent">Brand Display Name *</Label>
              <Input
                type="text"
                value={template.brandName}
                onChange={(e) => setTemplate({ ...template, brandName: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">Legal Entity / Company Name</Label>
              <Input
                type="text"
                value={template.legalName || ''}
                onChange={(e) => setTemplate({ ...template, legalName: e.target.value })}
                placeholder={`e.g. ${DEFAULT_BRAND_IDENTITY.legalName}`}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Tagline & Invoice Prefix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-accent">Brand Tagline</Label>
              <Input
                type="text"
                value={template.tagline || ''}
                onChange={(e) => setTemplate({ ...template, tagline: e.target.value })}
                placeholder="e.g. Crafted for Grace & Modesty"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">Invoice Number Prefix</Label>
              <Input
                type="text"
                value={template.invoicePrefix}
                onChange={(e) => setTemplate({ ...template, invoicePrefix: e.target.value })}
                placeholder="INV-HH-"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Tax / GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-accent">GSTIN / Tax ID</Label>
              <Input
                type="text"
                value={template.gstin || ''}
                onChange={(e) => setTemplate({ ...template, gstin: e.target.value })}
                placeholder="27AABCH1234F1Z5"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">PAN (Optional)</Label>
              <Input
                type="text"
                value={template.pan || ''}
                onChange={(e) => setTemplate({ ...template, pan: e.target.value })}
                placeholder="AABCH1234F"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Dispatch Origin Address */}
          <div className="space-y-1">
            <Label className="text-xs text-accent">Workshop / Dispatch Address Line 1 *</Label>
            <Input
              type="text"
              value={template.addressLine1}
              onChange={(e) => setTemplate({ ...template, addressLine1: e.target.value })}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-accent">City *</Label>
              <Input
                type="text"
                value={template.city}
                onChange={(e) => setTemplate({ ...template, city: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">State *</Label>
              <Input
                type="text"
                value={template.state}
                onChange={(e) => setTemplate({ ...template, state: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">PIN Code *</Label>
              <Input
                type="text"
                value={template.postalCode}
                onChange={(e) => setTemplate({ ...template, postalCode: e.target.value })}
                required
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Support Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-accent">Customer Support Email *</Label>
              <Input
                type="email"
                value={template.supportEmail}
                onChange={(e) => setTemplate({ ...template, supportEmail: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-accent">Support Helpline Phone *</Label>
              <Input
                type="text"
                value={template.supportPhone}
                onChange={(e) => setTemplate({ ...template, supportPhone: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Custom Footer Note */}
          <div className="space-y-1">
            <Label className="text-xs text-accent">
              Invoice Footer Greeting &amp; Authenticity Note
            </Label>
            <Textarea
              rows={2}
              value={template.footerNote}
              onChange={(e) => setTemplate({ ...template, footerNote: e.target.value })}
              className="text-xs resize-y"
            />
          </div>

          {/* Statutory Tax Itemization Toggle */}
          <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/20">
            <div className="space-y-0.5">
              <Label
                htmlFor="showGstBreakdown"
                className="text-xs font-semibold text-accent cursor-pointer"
              >
                Display Statutory GST Breakdown
              </Label>
              <div className="text-[11px] text-muted-foreground">
                Itemizes taxable value, CGST, SGST, and IGST on customer tax invoices.
              </div>
            </div>
            <input
              id="showGstBreakdown"
              type="checkbox"
              checked={template.showGstBreakdown}
              onChange={(e) => setTemplate({ ...template, showGstBreakdown: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
