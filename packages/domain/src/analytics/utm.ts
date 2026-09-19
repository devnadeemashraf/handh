import type { OrderAttribution } from './types';

/**
 * Checks whether a given referrer or user-agent represents an Instagram referral.
 */
export function isInstagramTraffic(referrer?: string, userAgent?: string): boolean {
  if (referrer) {
    const lowerRef = referrer.toLowerCase();
    if (
      lowerRef.includes('instagram.com') ||
      lowerRef.includes('l.instagram.com') ||
      lowerRef.includes('ig.me')
    ) {
      return true;
    }
  }

  if (userAgent) {
    const lowerUA = userAgent.toLowerCase();
    if (lowerUA.includes('instagram') || lowerUA.includes('igfb')) {
      return true;
    }
  }

  return false;
}

/**
 * Parses UTM query parameters and contextual hints into an OrderAttribution record.
 */
export function parseUtmParameters(
  searchParams: URLSearchParams | Record<string, string | undefined>,
  options: {
    referrer?: string;
    userAgent?: string;
    landingPage?: string;
  } = {}
): OrderAttribution {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    return searchParams[key];
  };

  const utmSource = getParam('utm_source');
  const utmMedium = getParam('utm_medium');
  const utmCampaign = getParam('utm_campaign');
  const utmContent = getParam('utm_content');
  const utmTerm = getParam('utm_term');
  const refCode = getParam('ref') || getParam('influencer');

  // Detect Instagram traffic even if explicit UTM source is missing
  let source = utmSource?.trim().toLowerCase();
  let medium = utmMedium?.trim().toLowerCase();

  if (!source) {
    if (isInstagramTraffic(options.referrer, options.userAgent)) {
      source = 'instagram';
      medium = medium || 'bio_or_story';
    } else if (options.referrer) {
      try {
        const refHost = new URL(options.referrer).hostname.toLowerCase();
        if (refHost.includes('google')) source = 'google';
        else if (refHost.includes('facebook') || refHost.includes('fb.me')) source = 'facebook';
        else if (refHost.includes('whatsapp') || refHost.includes('wa.me')) source = 'whatsapp';
        else source = refHost;
        medium = medium || 'referral';
      } catch {
        source = 'direct';
        medium = medium || 'none';
      }
    } else {
      source = 'direct';
      medium = medium || 'none';
    }
  }

  // Device detection from user-agent
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
  if (options.userAgent) {
    const ua = options.userAgent.toLowerCase();
    if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      deviceType = 'mobile';
    } else {
      deviceType = 'desktop';
    }
  }

  return {
    source,
    medium,
    campaign: utmCampaign?.trim(),
    content: utmContent?.trim(),
    term: utmTerm?.trim(),
    referrer: options.referrer,
    landingPage: options.landingPage,
    influencerCode: refCode?.trim().toUpperCase(),
    deviceType,
    capturedAt: new Date().toISOString()
  };
}
