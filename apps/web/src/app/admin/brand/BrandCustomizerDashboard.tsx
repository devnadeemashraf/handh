'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Truck,
  Shield,
  Clock,
  Megaphone,
  LayoutTemplate
} from 'lucide-react';
import type { StorefrontConfig, StorefrontReassurance } from '@hh/domain';

interface BrandCustomizerDashboardProps {
  initialConfig: StorefrontConfig;
}

export default function BrandCustomizerDashboard({ initialConfig }: BrandCustomizerDashboardProps) {
  // Announcement State
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    initialConfig.announcement.enabled
  );
  const [announcementText, setAnnouncementText] = useState(initialConfig.announcement.text);
  const [announcementBadge, setAnnouncementBadge] = useState(initialConfig.announcement.badge);
  const [announcementLink, _setAnnouncementLink] = useState(initialConfig.announcement.link ?? '');

  // Hero Section State
  const [heroEyebrow, setHeroEyebrow] = useState(initialConfig.hero.eyebrow);
  const [heroTitle, setHeroTitle] = useState(initialConfig.hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(initialConfig.hero.subtitle);
  const [heroCtaText, setHeroCtaText] = useState(initialConfig.hero.ctaText);
  const [heroCtaLink, setHeroCtaLink] = useState(initialConfig.hero.ctaLink);

  // Reassurances State
  const [reassurances, setReassurances] = useState<StorefrontReassurance[]>(
    initialConfig.reassurances
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleReassuranceChange = (
    index: number,
    field: 'title' | 'description' | 'icon',
    value: string
  ) => {
    setReassurances((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<StorefrontConfig> = {
        announcement: {
          enabled: announcementEnabled,
          text: announcementText.trim(),
          badge: announcementBadge.trim(),
          ...(announcementLink.trim() ? { link: announcementLink.trim() } : {})
        },
        hero: {
          eyebrow: heroEyebrow.trim(),
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
          ctaText: heroCtaText.trim(),
          ctaLink: heroCtaLink.trim()
        },
        reassurances
      };

      const res = await fetch('/api/admin/settings/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update storefront brand settings.');
      }

      setSaveSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error updating brand customizer.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck':
        return <Truck size={20} color="#C5A880" />;
      case 'shield':
        return <Shield size={20} color="#C5A880" />;
      case 'clock':
        return <Clock size={20} color="#C5A880" />;
      default:
        return <Sparkles size={20} color="#C5A880" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Palette style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontFamily: 'serif',
                fontWeight: 600,
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Brand &amp; Storefront Customizer
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Instantly update your storefront announcement banner, hero headlines, and luxury value
            badges without code changes.
          </p>
        </div>
      </div>

      {/* Main Customizer Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Announcement Bar */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone style={{ width: '18px', height: '18px', color: '#C5A880' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
                Storefront Announcement Ribbon
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAnnouncementEnabled(!announcementEnabled)}
              aria-label={
                announcementEnabled ? 'Disable Announcement Ribbon' : 'Enable Announcement Ribbon'
              }
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: announcementEnabled ? '#10B981' : '#1C4D3E',
                backgroundColor: announcementEnabled ? '#064E3B' : '#081F18',
                color: announcementEnabled ? '#6EE7B7' : '#8BAAA0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {announcementEnabled ? 'Ribbon Active' : 'Ribbon Hidden'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div>
                <label
                  htmlFor="announcementBadge"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Ribbon Pill Badge
                </label>
                <input
                  id="announcementBadge"
                  type="text"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  placeholder="e.g. Signature Drop"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#C5A880',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="announcementText"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Announcement Message
                </label>
                <input
                  id="announcementText"
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Announcement text..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#FDFBF7',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Live Announcement Ribbon Preview */}
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#8BAAA0',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}
              >
                <Eye size={14} color="#C5A880" />
                <span>Live Ribbon Preview</span>
              </div>
              <div
                style={{
                  backgroundColor: '#0A2E24',
                  border: '1px solid #164335',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: '#FDFBF7',
                  fontSize: '0.85rem'
                }}
              >
                {announcementBadge && (
                  <span
                    style={{
                      backgroundColor: '#C5A880',
                      color: '#0A2E24',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {announcementBadge}
                  </span>
                )}
                <span>{announcementText || 'Your announcement will appear here.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Hero Section */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '10px'
            }}
          >
            <LayoutTemplate style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
              Hero Showcase &amp; Call to Action
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div>
                <label
                  htmlFor="heroEyebrow"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Eyebrow Text
                </label>
                <input
                  id="heroEyebrow"
                  type="text"
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  placeholder="e.g. H&H Signature Collection"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#C5A880',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="heroTitle"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Main Headline
                </label>
                <input
                  id="heroTitle"
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. Crafted for Grace & Modesty"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#FDFBF7',
                    fontFamily: 'serif',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="heroSubtitle"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: '#FDFBF7',
                  marginBottom: '6px'
                }}
              >
                Supporting Subtitle
              </label>
              <textarea
                id="heroSubtitle"
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Supporting description..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#081F18',
                  border: '1px solid #1C4D3E',
                  borderRadius: '6px',
                  color: '#FDFBF7',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  htmlFor="heroCtaText"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Button Label
                </label>
                <input
                  id="heroCtaText"
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="e.g. Explore the Collection"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#FDFBF7',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="heroCtaLink"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Button Target Link
                </label>
                <input
                  id="heroCtaLink"
                  type="text"
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  placeholder="e.g. #catalog or /categories/rings"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#FDFBF7',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Live Hero Showcase Preview */}
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#8BAAA0',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}
              >
                <Eye size={14} color="#C5A880" />
                <span>Live Hero Preview</span>
              </div>
              <div
                style={{
                  backgroundColor: '#081F18',
                  border: '1px solid #1C4D3E',
                  borderRadius: '8px',
                  padding: '32px 24px',
                  textAlign: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#C5A880',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  {heroEyebrow}
                </span>
                <h1
                  style={{
                    fontFamily: 'serif',
                    fontSize: '1.85rem',
                    color: '#FDFBF7',
                    margin: '0 0 12px',
                    fontWeight: 600
                  }}
                >
                  {heroTitle}
                </h1>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#8BAAA0',
                    maxWidth: '480px',
                    margin: '0 auto 20px',
                    lineHeight: 1.5
                  }}
                >
                  {heroSubtitle}
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    backgroundColor: '#0A2E24',
                    border: '1px solid #C5A880',
                    color: '#C5A880',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em'
                  }}
                >
                  {heroCtaText}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Reassurance Value Badges */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '10px'
            }}
          >
            <Sparkles style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
              Reassurance Badges (3 Pillars)
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {reassurances.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#081F18',
                  border: '1px solid #1C4D3E',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#164335',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {renderBadgeIcon(item.icon)}
                  </div>
                  <select
                    value={item.icon}
                    onChange={(e) => handleReassuranceChange(idx, 'icon', e.target.value)}
                    aria-label={`Pillar ${idx + 1} Icon`}
                    style={{
                      backgroundColor: '#0B2920',
                      border: '1px solid #1C4D3E',
                      borderRadius: '4px',
                      color: '#FDFBF7',
                      fontSize: '0.8rem',
                      padding: '4px 8px',
                      outline: 'none'
                    }}
                  >
                    <option value="sparkles">Sparkles (Craftsmanship)</option>
                    <option value="truck">Truck (Direct Courier)</option>
                    <option value="shield">Shield (Secure Payments)</option>
                    <option value="clock">Clock (Timely Dispatch)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`pillarTitle-${idx}`}
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '4px'
                    }}
                  >
                    Pillar {idx + 1} Title
                  </label>
                  <input
                    id={`pillarTitle-${idx}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => handleReassuranceChange(idx, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#0B2920',
                      border: '1px solid #1C4D3E',
                      borderRadius: '4px',
                      color: '#FDFBF7',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`pillarDesc-${idx}`}
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '4px'
                    }}
                  >
                    Pillar {idx + 1} Description
                  </label>
                  <textarea
                    id={`pillarDesc-${idx}`}
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleReassuranceChange(idx, 'description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#0B2920',
                      border: '1px solid #1C4D3E',
                      borderRadius: '4px',
                      color: '#FDFBF7',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#064E3B',
              border: '1px solid #059669',
              borderRadius: '8px',
              color: '#6EE7B7',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem'
            }}
          >
            <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>Storefront brand configuration published successfully to live website.</span>
          </div>
        )}

        {saveError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#451A1A',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem'
            }}
          >
            <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Form Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="admin-btn-primary"
            style={{
              padding: '10px 24px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span>Save &amp; Publish Storefront</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
