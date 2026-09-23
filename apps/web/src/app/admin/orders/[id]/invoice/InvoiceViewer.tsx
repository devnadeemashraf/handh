'use client';

import { ArrowLeft, Printer, Sliders, Tag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import type { InvoiceData } from '@hh/domain';

import InvoiceCustomizerModal from './InvoiceCustomizerModal';

interface InvoiceViewerProps {
  initialInvoiceData: InvoiceData;
  orderId: string;
}

export default function InvoiceViewer({ initialInvoiceData, orderId }: InvoiceViewerProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const template = invoiceData.template;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
        <Link
          href={`/admin/orders/${orderId}`}
          className="inline-flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Order</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizerOpen(true)}
            className="h-9 gap-1.5 text-xs text-accent border-accent/40 hover:bg-accent/10"
            title="Edit brand name, address, GSTIN, and notes"
          >
            <Sliders className="h-4 w-4" />
            <span>Customize Template</span>
          </Button>

          <Link
            href={`/admin/orders/${orderId}/packing-slip`}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            <Tag className="h-4 w-4 text-primary" />
            <span>Switch to 4x6 Thermal Slip</span>
          </Link>

          <Button size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs">
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF (A4)</span>
          </Button>
        </div>
      </div>

      {/* A4 Printable Sheet Container */}
      <div className="invoice-container bg-white text-zinc-900 p-8 sm:p-10 rounded-lg max-w-[840px] mx-auto w-full shadow-md border border-zinc-200">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-6 mb-6">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md bg-[#0A2E24] text-[#C5A880] flex items-center justify-center text-xs font-extrabold shadow-xs">
                H&amp;H
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#0A2E24] m-0">
                {template.brandName}
              </h1>
            </div>

            {template.legalName && (
              <div className="text-xs text-zinc-600 font-semibold">{template.legalName}</div>
            )}
            <div className="text-xs text-zinc-500 mt-0.5 max-w-xs leading-relaxed">
              {template.addressLine1}
              {template.addressLine2 ? `, ${template.addressLine2}` : ''}
              <br />
              {template.city}, {template.state} - {template.postalCode}, {template.country}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Email: {template.supportEmail} &bull; Tel: {template.supportPhone}
            </div>
            {template.gstin && (
              <div className="text-[11px] text-zinc-900 font-bold mt-1 font-mono">
                GSTIN: {template.gstin}
                {template.pan ? ` | PAN: ${template.pan}` : ''}
              </div>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="text-right">
            <span className="inline-block py-1 px-2.5 rounded bg-[#0A2E24] text-[#C5A880] text-xs font-bold tracking-wider uppercase mb-2">
              Tax Invoice
            </span>
            <div className="text-lg font-bold text-zinc-900 font-mono">
              {invoiceData.invoiceNumber}
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">
              Order Ref: <strong className="text-zinc-900">{invoiceData.orderNumber}</strong>
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Date: {formatDate(invoiceData.orderDate)}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              Payment: {invoiceData.paymentStatus.toUpperCase()} (Captured)
            </div>
            {invoiceData.paymentId && (
              <div className="text-[11px] text-zinc-500 font-mono">
                Ref: {invoiceData.paymentId}
              </div>
            )}
          </div>
        </div>

        {/* Billed To & Shipped To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-md border border-zinc-200 mb-6 text-xs sm:text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Customer &amp; Billed To
            </div>
            <div className="font-bold text-zinc-900 text-sm">{invoiceData.customer.name}</div>
            <div className="text-zinc-600 mt-0.5">{invoiceData.customer.phone}</div>
            <div className="text-zinc-600">{invoiceData.customer.email}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Dispatch Destination (Ship To)
            </div>
            <div className="text-zinc-900 leading-relaxed text-xs sm:text-sm">
              {invoiceData.customer.address.line1}
              {invoiceData.customer.address.line2 ? `, ${invoiceData.customer.address.line2}` : ''}
              <br />
              {invoiceData.customer.address.city}, {invoiceData.customer.address.state} -{' '}
              <strong>{invoiceData.customer.address.postalCode}</strong>
              <br />
              {invoiceData.customer.address.country}
            </div>
            {invoiceData.trackingNumber && (
              <div className="mt-1 text-xs text-emerald-700 font-medium">
                Courier: <strong>{invoiceData.courierName || 'DTDC'}</strong> &bull; AWB:{' '}
                <strong className="font-mono">{invoiceData.trackingNumber}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full border-collapse mb-6 text-xs sm:text-sm">
          <thead>
            <tr className="bg-zinc-100 border-b-2 border-zinc-300">
              <th className="text-left py-2.5 px-3 font-bold text-zinc-700">#</th>
              <th className="text-left py-2.5 px-3 font-bold text-zinc-700">
                Artisanal Piece Description
              </th>
              <th className="text-left py-2.5 px-3 font-bold text-zinc-700">SKU</th>
              <th className="text-center py-2.5 px-3 font-bold text-zinc-700">Qty</th>
              <th className="text-right py-2.5 px-3 font-bold text-zinc-700">Unit Price</th>
              <th className="text-right py-2.5 px-3 font-bold text-zinc-700">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index} className="border-b border-zinc-200">
                <td className="py-3 px-3 text-zinc-500">{index + 1}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-zinc-900">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.variantTitle}</div>
                </td>
                <td className="py-3 px-3 font-mono text-zinc-600">{item.sku}</td>
                <td className="py-3 px-3 text-center font-semibold text-zinc-900">
                  {item.quantity}
                </td>
                <td className="py-3 px-3 text-right text-zinc-600">
                  {formatPrice(item.unitPriceMinor)}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-zinc-900">
                  {formatPrice(item.totalMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Breakdown */}
        <div className="flex justify-end mb-8">
          <div className="w-72 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 text-zinc-600">
              <span>Subtotal</span>
              <span>{formatPrice(invoiceData.subtotalMinor)}</span>
            </div>

            <div className="flex justify-between py-1.5 text-zinc-600">
              <span>Courier Delivery</span>
              <span>
                {invoiceData.deliveryFeeMinor === 0
                  ? 'FREE'
                  : formatPrice(invoiceData.deliveryFeeMinor)}
              </span>
            </div>

            {invoiceData.discountMinor > 0 && (
              <div className="flex justify-between py-1.5 text-emerald-600 font-medium">
                <span>Discount Applied</span>
                <span>-{formatPrice(invoiceData.discountMinor)}</span>
              </div>
            )}

            {/* Statutory GST Tax Itemization */}
            {(template.showGstBreakdown || (invoiceData.taxMinor ?? 0) > 0) &&
              (invoiceData.taxMinor ?? 0) > 0 && (
                <div
                  data-testid="invoice-gst-breakdown"
                  className="py-2 border-t border-dashed border-zinc-300 my-1 space-y-1 text-zinc-600 text-xs"
                >
                  <div className="flex justify-between text-zinc-500">
                    <span>Taxable Base Value</span>
                    <span>{formatPrice(invoiceData.taxableAmountMinor ?? 0)}</span>
                  </div>
                  {(invoiceData.cgstMinor ?? 0) > 0 && (
                    <div className="flex justify-between text-zinc-500">
                      <span>CGST (9%)</span>
                      <span>{formatPrice(invoiceData.cgstMinor ?? 0)}</span>
                    </div>
                  )}
                  {(invoiceData.sgstMinor ?? 0) > 0 && (
                    <div className="flex justify-between text-zinc-500">
                      <span>SGST (9%)</span>
                      <span>{formatPrice(invoiceData.sgstMinor ?? 0)}</span>
                    </div>
                  )}
                  {(invoiceData.igstMinor ?? 0) > 0 && (
                    <div className="flex justify-between text-zinc-500">
                      <span>IGST (18%)</span>
                      <span>{formatPrice(invoiceData.igstMinor ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-zinc-700">
                    <span>Total GST Included</span>
                    <span>{formatPrice(invoiceData.taxMinor ?? 0)}</span>
                  </div>
                </div>
              )}

            <div className="flex justify-between py-2.5 border-t-2 border-zinc-900 mt-1.5 text-base font-extrabold text-[#0A2E24]">
              <span>Grand Total</span>
              <span>{formatPrice(invoiceData.totalAmountMinor)}</span>
            </div>
            <div className="text-[11px] text-zinc-500 text-right">
              Inclusive of all taxes &amp; packaging
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Notes */}
        <div className="border-t border-zinc-200 pt-4 flex justify-between items-end text-xs text-zinc-500">
          <div className="max-w-md">
            <div className="font-semibold text-zinc-700 mb-0.5">
              Authenticity &amp; Care Guarantee
            </div>
            <p className="m-0 leading-relaxed">{template.footerNote}</p>
            <div className="mt-2 text-[11px] text-zinc-400">
              This is a computer-generated tax invoice. No signature required.
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-zinc-900">For {template.brandName}</div>
            <div className="mt-6 border-t border-zinc-400 pt-1 text-[11px]">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Template Customizer Modal */}
      {isCustomizerOpen && (
        <InvoiceCustomizerModal
          initialTemplate={template}
          onSave={(updated) => {
            setInvoiceData((prev) => ({ ...prev, template: updated }));
          }}
          onClose={() => setIsCustomizerOpen(false)}
        />
      )}
    </div>
  );
}
