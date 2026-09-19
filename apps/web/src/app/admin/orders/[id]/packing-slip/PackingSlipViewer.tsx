'use client';

import { ArrowLeft, FileText, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import type { InvoiceData } from '@hh/domain';

interface PackingSlipViewerProps {
  invoiceData: InvoiceData;
  orderId: string;
}

const BARCODE_WIDTHS = [
  'w-[3px]',
  'w-[1px]',
  'w-[4px]',
  'w-[1px]',
  'w-[2px]',
  'w-[5px]',
  'w-[2px]',
  'w-[1px]',
  'w-[4px]',
  'w-[2px]',
  'w-[1px]',
  'w-[3px]',
  'w-[2px]',
  'w-[4px]',
  'w-[1px]',
  'w-[2px]',
  'w-[5px]',
  'w-[1px]',
  'w-[3px]',
  'w-[2px]',
  'w-[4px]',
  'w-[1px]',
  'w-[2px]',
  'w-[3px]',
  'w-[1px]',
  'w-[4px]',
  'w-[2px]',
  'w-[1px]',
  'w-[3px]',
  'w-[2px]'
];

export default function PackingSlipViewer({ invoiceData, orderId }: PackingSlipViewerProps) {
  const template = invoiceData.template;
  const address = invoiceData.customer.address;

  return (
    <div className="flex flex-col gap-5 items-center">
      {/* Top Floating Controls (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-xs w-full max-w-[500px]">
        <Link
          href={`/admin/orders/${orderId}`}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Order</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${orderId}/invoice`}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span>A4 Tax Invoice</span>
          </Link>

          <Button size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs">
            <Printer className="h-4 w-4" />
            <span>Print 4x6 Thermal</span>
          </Button>
        </div>
      </div>

      {/* 4x6" Thermal Shipping Slip Container */}
      <div className="thermal-slip-container bg-white text-black w-96 min-h-[576px] p-5 border-2 border-black rounded font-mono shadow-md">
        {/* Top Header & Courier Identification */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="bg-black text-white px-1.5 py-0.5 font-black text-sm">H&amp;H</div>
            <span className="font-extrabold text-sm tracking-wider">EXPRESS DISPATCH</span>
          </div>
          <div className="border-2 border-black py-0.5 px-2 font-black text-xs uppercase">
            {invoiceData.courierName || 'DTDC / SPEED POST'}
          </div>
        </div>

        {/* Tracking AWB Barcode Simulation */}
        <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
          <div className="text-[11px] font-bold tracking-widest">TRACKING AWB NUMBER</div>
          <div className="text-xl font-black tracking-widest my-1">
            {invoiceData.trackingNumber || invoiceData.orderNumber}
          </div>
          {/* Visual Barcode Bars simulation */}
          <div className="flex justify-center items-center gap-0.5 h-8 my-1">
            {BARCODE_WIDTHS.map((widthClass, idx) => (
              <div key={idx} className={`${widthClass} h-full bg-black`} />
            ))}
          </div>
          <div className="text-[10px]">ORDER: {invoiceData.orderNumber} &bull; PREPAID</div>
        </div>

        {/* Massive Delivery Destination Box */}
        <div className="border-2 border-black p-2.5 mb-3 bg-zinc-50">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1">
            SHIP TO DESTINATION:
          </div>
          <div className="text-lg font-black">{invoiceData.customer.name}</div>
          <div className="text-sm font-bold my-0.5">TEL: {invoiceData.customer.phone}</div>
          <div className="text-xs leading-tight">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.state}
          </div>
          <div className="text-2xl font-black mt-1 tracking-wider">PIN: {address.postalCode}</div>
        </div>

        {/* Workshop Packing Checklist */}
        <div className="mb-3.5">
          <div className="text-[11px] font-extrabold border-b border-black pb-0.5 mb-1.5">
            WORKSHOP PACKING CHECKLIST ({invoiceData.items.length} ITEMS)
          </div>
          <div className="flex flex-col gap-1.5">
            {invoiceData.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div className="w-3.5 h-3.5 border-[1.5px] border-black shrink-0 mt-0.5" />
                <div>
                  <strong>{item.quantity}x</strong> {item.title} ({item.variantTitle})
                  <div className="text-[10px] text-zinc-600">SKU: {item.sku}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Origin Address */}
        <div className="border-t border-dashed border-black pt-2 text-[10px] leading-tight">
          <strong>RETURN ORIGIN (IF UNDELIVERED):</strong>
          <br />
          {template.brandName} &bull; {template.addressLine1}, {template.city}, {template.state} -{' '}
          {template.postalCode}
          <br />
          Helpline: {template.supportPhone}
        </div>
      </div>
    </div>
  );
}
