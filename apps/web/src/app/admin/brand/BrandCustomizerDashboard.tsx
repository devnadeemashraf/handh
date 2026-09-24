'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  LayoutTemplate,
  Megaphone,
  Palette,
  RefreshCw,
  Shield,
  Sparkles,
  Truck
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
  const [announcementLink, setAnnouncementLink] = useState(initialConfig.announcement.link ?? '');

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
          variant: 'default',
          badgeVariant: 'gold',
          ...(announcementLink.trim() ? { link: announcementLink.trim() } : {})
        },
        hero: {
          eyebrow: heroEyebrow.trim(),
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
          ctaText: heroCtaText.trim(),
          ctaLink: heroCtaLink.trim(),
          variant: 'luxury',
          ctaVariant: 'default',
          alignment: 'center'
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
        return <Truck className="h-5 w-5 text-accent" />;
      case 'shield':
        return <Shield className="h-5 w-5 text-accent" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-accent" />;
      default:
        return <Sparkles className="h-5 w-5 text-accent" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Brand &amp; Storefront Customizer
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Instantly update your storefront announcement banner, hero headlines, and luxury value
          badges without code changes.
        </p>
      </div>

      {/* Main Customizer Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* 1. Announcement Bar */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between border-b border-border space-y-0">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-accent" />
              <CardTitle className="text-base font-semibold">
                Storefront Announcement Ribbon
              </CardTitle>
            </div>
            <button
              type="button"
              onClick={() => setAnnouncementEnabled(!announcementEnabled)}
              aria-label={
                announcementEnabled ? 'Disable Announcement Ribbon' : 'Enable Announcement Ribbon'
              }
              className={cn(
                'rounded-md px-3.5 py-1 text-xs font-semibold transition-colors border',
                announcementEnabled
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {announcementEnabled ? 'Ribbon Active' : 'Ribbon Hidden'}
            </button>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="announcementBadge"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Ribbon Pill Badge
                </label>
                <Input
                  id="announcementBadge"
                  type="text"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  placeholder="e.g. Signature Drop"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="announcementText"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Announcement Message
                </label>
                <Input
                  id="announcementText"
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Announcement text..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="announcementLink"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Ribbon Target Link (Optional)
              </label>
              <Input
                id="announcementLink"
                type="text"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="e.g. #catalog, /categories/rings, or https://..."
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Must be a relative link (starts with / or #) or a secure HTTPS URL (E-COM-136).
              </p>
            </div>

            {/* Live Announcement Ribbon Preview */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>Live Ribbon Preview</span>
              </div>
              <div className="rounded-lg border border-border bg-primary text-primary-foreground p-3 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-center">
                {announcementBadge && (
                  <Badge
                    variant="secondary"
                    className="font-semibold uppercase tracking-wider text-[10px]"
                  >
                    {announcementBadge}
                  </Badge>
                )}
                <span>{announcementText || 'Your announcement will appear here.'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Hero Section */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center gap-2 border-b border-border space-y-0">
            <LayoutTemplate className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">
              Hero Showcase &amp; Call to Action
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="heroEyebrow"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Eyebrow Text
                </label>
                <Input
                  id="heroEyebrow"
                  type="text"
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  placeholder="e.g. H&H Signature Collection"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="heroTitle"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Main Headline
                </label>
                <Input
                  id="heroTitle"
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. Crafted for Grace & Modesty"
                  className="font-serif font-semibold"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="heroSubtitle"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Supporting Subtitle
              </label>
              <Textarea
                id="heroSubtitle"
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Supporting description..."
                className="resize-y leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="heroCtaText"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Button Label
                </label>
                <Input
                  id="heroCtaText"
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="e.g. Explore the Collection"
                />
              </div>

              <div>
                <label
                  htmlFor="heroCtaLink"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Button Target Link
                </label>
                <Input
                  id="heroCtaLink"
                  type="text"
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  placeholder="e.g. #catalog or /categories/rings"
                />
              </div>
            </div>

            {/* Live Hero Showcase Preview */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>Live Hero Preview</span>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 sm:p-10 text-center shadow-xs">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
                  {heroEyebrow}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
                  {heroTitle}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
                  {heroSubtitle}
                </p>
                <div className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium px-6 py-2.5 text-xs sm:text-sm shadow-xs border border-accent/30">
                  {heroCtaText}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Reassurance Value Badges */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 flex flex-row items-center gap-2 border-b border-border space-y-0">
            <Sparkles className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">
              Reassurance Badges (3 Pillars)
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reassurances.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                      {renderBadgeIcon(item.icon)}
                    </div>
                    <select
                      value={item.icon}
                      onChange={(e) => handleReassuranceChange(idx, 'icon', e.target.value)}
                      aria-label={`Pillar ${idx + 1} Icon`}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Pillar {idx + 1} Title
                    </label>
                    <Input
                      id={`pillarTitle-${idx}`}
                      type="text"
                      value={item.title}
                      onChange={(e) => handleReassuranceChange(idx, 'title', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`pillarDesc-${idx}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Pillar {idx + 1} Description
                    </label>
                    <Textarea
                      id={`pillarDesc-${idx}`}
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleReassuranceChange(idx, 'description', e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Storefront brand configuration published successfully to live website.</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Form Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a
            href="/api/draft/preview?path=/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-xs"
          >
            <Eye className="h-4 w-4 text-accent" />
            <span>Live Storefront Preview</span>
          </a>

          <Button type="submit" disabled={isSaving} size="lg" className="gap-2">
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Save &amp; Publish Storefront</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
