'use client';

import { Printer, ArrowLeft, FileText } from 'lucide-react';
import type { InvoiceData } from '@hh/domain';

interface PackingSlipViewerProps {
  invoiceData: InvoiceData;
  orderId: string;
}

export default function PackingSlipViewer({ invoiceData, orderId }: PackingSlipViewerProps) {
  const template = invoiceData.template;
  const address = invoiceData.customer.address;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      {/* Top Floating Controls (Hidden on Print) */}
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
          border: '1px solid #1C4D3E',
          width: '100%',
          maxWidth: '500px'
        }}
      >
        <a
          href={`/admin/orders/${orderId}`}
          className="admin-btn-secondary"
          style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>Order</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={`/admin/orders/${orderId}/invoice`}
            className="admin-btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <FileText style={{ width: '15px', height: '15px', color: '#C5A880' }} />
            <span>A4 Tax Invoice</span>
          </a>

          <button
            onClick={() => window.print()}
            className="admin-btn-primary"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Printer style={{ width: '16px', height: '16px' }} />
            <span>Print 4x6 Thermal</span>
          </button>
        </div>
      </div>

      {/* 4x6" Thermal Shipping Slip Container */}
      <div
        className="thermal-slip-container"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          width: '384px', // approx 4 inches at 96 DPI
          minHeight: '576px', // approx 6 inches at 96 DPI
          padding: '20px',
          border: '2px solid #000000',
          borderRadius: '4px',
          boxSizing: 'border-box',
          fontFamily: 'monospace, sans-serif'
        }}
      >
        {/* Top Header & Courier Identification */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #000000',
            paddingBottom: '10px',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                backgroundColor: '#000000',
                color: '#FFFFFF',
                padding: '3px 6px',
                fontWeight: 900,
                fontSize: '0.875rem'
              }}
            >
              H&amp;H
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.05em' }}>
              EXPRESS DISPATCH
            </span>
          </div>
          <div
            style={{
              border: '2px solid #000000',
              padding: '2px 8px',
              fontWeight: 900,
              fontSize: '0.8125rem',
              textTransform: 'uppercase'
            }}
          >
            {invoiceData.courierName || 'DTDC / SPEED POST'}
          </div>
        </div>

        {/* Tracking AWB Barcode Simulation */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px dashed #000000',
            paddingBottom: '12px',
            marginBottom: '12px'
          }}
        >
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            TRACKING AWB NUMBER
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.15em',
              margin: '4px 0'
            }}
          >
            {invoiceData.trackingNumber || invoiceData.orderNumber}
          </div>
          {/* Visual Barcode Bars simulation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2px',
              height: '32px',
              margin: '4px 0'
            }}
          >
            {[
              3, 1, 4, 1, 2, 5, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 5, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3,
              2
            ].map((width, idx) => (
              <div
                key={idx}
                style={{
                  width: `${width}px`,
                  height: '100%',
                  backgroundColor: '#000000'
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '0.625rem' }}>
            ORDER: {invoiceData.orderNumber} &bull; PREPAID
          </div>
        </div>

        {/* Massive Delivery Destination Box */}
        <div
          style={{
            border: '2px solid #000000',
            padding: '10px',
            marginBottom: '12px',
            backgroundColor: '#FAFAFA'
          }}
        >
          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px'
            }}
          >
            SHIP TO DESTINATION:
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 900 }}>{invoiceData.customer.name}</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, margin: '2px 0' }}>
            TEL: {invoiceData.customer.phone}
          </div>
          <div style={{ fontSize: '0.8125rem', lineHeight: '1.3' }}>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.state}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              marginTop: '4px',
              letterSpacing: '0.05em'
            }}
          >
            PIN: {address.postalCode}
          </div>
        </div>

        {/* Workshop Packing Checklist */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              borderBottom: '1px solid #000000',
              paddingBottom: '2px',
              marginBottom: '6px'
            }}
          >
            WORKSHOP PACKING CHECKLIST ({invoiceData.items.length} ITEMS)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {invoiceData.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '1.5px solid #000000',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                />
                <div>
                  <strong>{item.quantity}x</strong> {item.title} ({item.variantTitle})
                  <div style={{ fontSize: '0.625rem', color: '#4B5563' }}>SKU: {item.sku}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Origin Address */}
        <div
          style={{
            borderTop: '1px dashed #000000',
            paddingTop: '8px',
            fontSize: '0.625rem',
            lineHeight: '1.3'
          }}
        >
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
