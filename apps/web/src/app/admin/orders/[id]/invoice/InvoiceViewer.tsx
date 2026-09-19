'use client';

import { useState } from 'react';
import { Printer, Sliders, ArrowLeft, Tag } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#0F2D24',
          borderRadius: '12px',
          border: '1px solid #1C4D3E'
        }}
      >
        <a
          href={`/admin/orders/${orderId}`}
          className="admin-btn-secondary"
          style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>Back to Order</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="admin-btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8125rem' }}
            title="Edit brand name, address, GSTIN, and notes"
          >
            <Sliders style={{ width: '15px', height: '15px', color: '#C5A880' }} />
            <span>Customize Template</span>
          </button>

          <a
            href={`/admin/orders/${orderId}/packing-slip`}
            className="admin-btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <Tag style={{ width: '15px', height: '15px', color: '#73A796' }} />
            <span>Switch to 4x6 Thermal Slip</span>
          </a>

          <button
            onClick={() => window.print()}
            className="admin-btn-primary"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Printer style={{ width: '16px', height: '16px' }} />
            <span>Print / Save PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 Printable Sheet Container */}
      <div
        className="invoice-container"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#111827',
          padding: '40px',
          borderRadius: '8px',
          maxWidth: '840px',
          margin: '0 auto',
          width: '100%',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header Block */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #E5E7EB',
            paddingBottom: '24px',
            marginBottom: '24px'
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#0A2E24',
                  color: '#C5A880',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                H&amp;H
              </div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'serif',
                  fontWeight: 700,
                  color: '#0A2E24',
                  margin: 0
                }}
              >
                {template.brandName}
              </h1>
            </div>

            {template.legalName && (
              <div style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 600 }}>
                {template.legalName}
              </div>
            )}
            <div
              style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px', maxWidth: '300px' }}
            >
              {template.addressLine1}
              {template.addressLine2 ? `, ${template.addressLine2}` : ''}
              <br />
              {template.city}, {template.state} - {template.postalCode}, {template.country}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
              Email: {template.supportEmail} &bull; Tel: {template.supportPhone}
            </div>
            {template.gstin && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: '#111827',
                  fontWeight: 700,
                  marginTop: '4px',
                  fontFamily: 'monospace'
                }}
              >
                GSTIN: {template.gstin}
                {template.pan ? ` | PAN: ${template.pan}` : ''}
              </div>
            )}
          </div>

          {/* Invoice Meta */}
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#0A2E24',
                color: '#C5A880',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              Tax Invoice
            </span>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#111827',
                fontFamily: 'monospace'
              }}
            >
              {invoiceData.invoiceNumber}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '2px' }}>
              Order Ref: <strong style={{ color: '#111827' }}>{invoiceData.orderNumber}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              Date: {formatDate(invoiceData.orderDate)}
            </div>
            <div
              style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: '4px' }}
            >
              Payment: {invoiceData.paymentStatus.toUpperCase()} (Captured)
            </div>
            {invoiceData.paymentId && (
              <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontFamily: 'monospace' }}>
                Ref: {invoiceData.paymentId}
              </div>
            )}
          </div>
        </div>

        {/* Billed To & Shipped To */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            backgroundColor: '#F9FAFB',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
            fontSize: '0.8125rem'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6B7280',
                marginBottom: '6px'
              }}
            >
              Customer &amp; Billed To
            </div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>
              {invoiceData.customer.name}
            </div>
            <div style={{ color: '#4B5563', marginTop: '2px' }}>{invoiceData.customer.phone}</div>
            <div style={{ color: '#4B5563' }}>{invoiceData.customer.email}</div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6B7280',
                marginBottom: '6px'
              }}
            >
              Dispatch Destination (Ship To)
            </div>
            <div style={{ color: '#111827', lineHeight: '1.4' }}>
              {invoiceData.customer.address.line1}
              {invoiceData.customer.address.line2 ? `, ${invoiceData.customer.address.line2}` : ''}
              <br />
              {invoiceData.customer.address.city}, {invoiceData.customer.address.state} -{' '}
              <strong>{invoiceData.customer.address.postalCode}</strong>
              <br />
              {invoiceData.customer.address.country}
            </div>
            {invoiceData.trackingNumber && (
              <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#047857' }}>
                Courier: <strong>{invoiceData.courierName || 'DTDC'}</strong> &bull; AWB:{' '}
                <strong style={{ fontFamily: 'monospace' }}>{invoiceData.trackingNumber}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
            fontSize: '0.8125rem'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #D1D5DB' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                #
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                Artisanal Piece Description
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                SKU
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                Total (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px', color: '#6B7280' }}>{index + 1}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.variantTitle}</div>
                </td>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#4B5563' }}>
                  {item.sku}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#111827'
                  }}
                >
                  {item.quantity}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#4B5563' }}>
                  {formatPrice(item.unitPriceMinor)}
                </td>
                <td
                  style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#111827' }}
                >
                  {formatPrice(item.totalMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '280px', fontSize: '0.8125rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                color: '#4B5563'
              }}
            >
              <span>Subtotal</span>
              <span>{formatPrice(invoiceData.subtotalMinor)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                color: '#4B5563'
              }}
            >
              <span>Courier Delivery</span>
              <span>
                {invoiceData.deliveryFeeMinor === 0
                  ? 'FREE'
                  : formatPrice(invoiceData.deliveryFeeMinor)}
              </span>
            </div>

            {invoiceData.discountMinor > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  color: '#059669'
                }}
              >
                <span>Discount Applied</span>
                <span>-{formatPrice(invoiceData.discountMinor)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: '2px solid #111827',
                marginTop: '6px',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#0A2E24'
              }}
            >
              <span>Grand Total</span>
              <span>{formatPrice(invoiceData.totalAmountMinor)}</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#6B7280', textAlign: 'right' }}>
              Inclusive of all taxes &amp; packaging
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Notes */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '0.75rem',
            color: '#6B7280'
          }}
        >
          <div style={{ maxWidth: '480px' }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '2px' }}>
              Authenticity &amp; Care Guarantee
            </div>
            <p style={{ margin: 0, lineHeight: '1.4' }}>{template.footerNote}</p>
            <div style={{ marginTop: '8px', fontSize: '0.6875rem', color: '#9CA3AF' }}>
              This is a computer-generated tax invoice. No signature required.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827' }}>
              For {template.brandName}
            </div>
            <div
              style={{
                marginTop: '24px',
                borderTop: '1px solid #9CA3AF',
                paddingTop: '4px',
                fontSize: '0.6875rem'
              }}
            >
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
