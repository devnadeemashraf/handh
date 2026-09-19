'use client';
import { AlertTriangle, CheckCircle2, Sliders, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { InvoiceTemplateConfig } from '@hh/domain';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '16px'
      }}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#8BAAA0',
            cursor: 'pointer'
          }}
          title="Close modal"
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Sliders style={{ width: '20px', height: '20px', color: '#C5A880' }} />
          <h2
            style={{
              fontSize: '1.25rem',
              fontFamily: 'serif',
              color: '#FDFBF7',
              margin: 0
            }}
          >
            Customize Invoice Template
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: '0 0 16px' }}>
          Personalize brand details, tax identification, and custom messaging across all customer
          invoices.
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#3B1313',
              border: '1px solid #7F1D1D',
              color: '#F87171',
              fontSize: '0.8125rem',
              marginBottom: '14px'
            }}
          >
            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#0F392B',
              border: '1px solid #165D46',
              color: '#6EE7B7',
              fontSize: '0.8125rem',
              marginBottom: '14px'
            }}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>Template saved and applied!</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {/* Brand Name & Legal Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Brand Display Name *
              </label>
              <input
                type="text"
                value={template.brandName}
                onChange={(e) => setTemplate({ ...template, brandName: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Legal Entity / Company Name
              </label>
              <input
                type="text"
                value={template.legalName || ''}
                onChange={(e) => setTemplate({ ...template, legalName: e.target.value })}
                placeholder="e.g. H&H Luxury Goods Pvt. Ltd."
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Tagline & Invoice Prefix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Brand Tagline
              </label>
              <input
                type="text"
                value={template.tagline || ''}
                onChange={(e) => setTemplate({ ...template, tagline: e.target.value })}
                placeholder="e.g. Crafted for Grace & Modesty"
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={template.invoicePrefix}
                onChange={(e) => setTemplate({ ...template, invoicePrefix: e.target.value })}
                placeholder="INV-HH-"
                className="admin-search-input"
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Tax / GSTIN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={template.gstin || ''}
                onChange={(e) => setTemplate({ ...template, gstin: e.target.value })}
                placeholder="27AABCH1234F1Z5"
                className="admin-search-input"
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                PAN (Optional)
              </label>
              <input
                type="text"
                value={template.pan || ''}
                onChange={(e) => setTemplate({ ...template, pan: e.target.value })}
                placeholder="AABCH1234F"
                className="admin-search-input"
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Dispatch Origin Address */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#C5A880',
                marginBottom: '4px'
              }}
            >
              Workshop / Dispatch Address Line 1 *
            </label>
            <input
              type="text"
              value={template.addressLine1}
              onChange={(e) => setTemplate({ ...template, addressLine1: e.target.value })}
              required
              className="admin-search-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                City *
              </label>
              <input
                type="text"
                value={template.city}
                onChange={(e) => setTemplate({ ...template, city: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                State *
              </label>
              <input
                type="text"
                value={template.state}
                onChange={(e) => setTemplate({ ...template, state: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                PIN Code *
              </label>
              <input
                type="text"
                value={template.postalCode}
                onChange={(e) => setTemplate({ ...template, postalCode: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Support Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Customer Support Email *
              </label>
              <input
                type="email"
                value={template.supportEmail}
                onChange={(e) => setTemplate({ ...template, supportEmail: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#C5A880',
                  marginBottom: '4px'
                }}
              >
                Support Helpline Phone *
              </label>
              <input
                type="text"
                value={template.supportPhone}
                onChange={(e) => setTemplate({ ...template, supportPhone: e.target.value })}
                required
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Custom Footer Note */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#C5A880',
                marginBottom: '4px'
              }}
            >
              Invoice Footer Greeting &amp; Authenticity Note
            </label>
            <textarea
              rows={2}
              value={template.footerNote}
              onChange={(e) => setTemplate({ ...template, footerNote: e.target.value })}
              className="admin-search-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '12px'
            }}
          >
            <button type="button" onClick={onClose} className="admin-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="admin-btn-primary">
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
