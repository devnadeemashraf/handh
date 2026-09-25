import { Fraunces, Inter } from 'next/font/google';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AttributionTracker } from '@/components/layout/AttributionTracker';
import { MobileNav } from '@/components/layout/MobileNav';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { PwaRegister } from '@/components/layout/PwaRegister';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { SearchProvider } from '@/context/SearchContext';
import { getCachedStore } from '@/lib/catalog-cache';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { DEFAULT_BRAND_IDENTITY, resolveStorefrontConfig } from '@hh/domain';

import '../lib/polyfill-crypto';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz']
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: `${DEFAULT_BRAND_IDENTITY.name} — ${DEFAULT_BRAND_IDENTITY.subtitle}`,
    template: `%s | ${DEFAULT_BRAND_IDENTITY.name}`
  },
  description: DEFAULT_BRAND_IDENTITY.description,
  metadataBase: new URL(process.env['APP_URL'] ?? DEFAULT_BRAND_IDENTITY.websiteUrl),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  },
  openGraph: {
    title: `${DEFAULT_BRAND_IDENTITY.name} — ${DEFAULT_BRAND_IDENTITY.subtitle}`,
    description: DEFAULT_BRAND_IDENTITY.description,
    type: 'website',
    siteName: DEFAULT_BRAND_IDENTITY.name
  },
  twitter: {
    card: 'summary_large_image',
    title: `${DEFAULT_BRAND_IDENTITY.name} — ${DEFAULT_BRAND_IDENTITY.subtitle}`,
    description: DEFAULT_BRAND_IDENTITY.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export const viewport: Viewport = {
  themeColor: '#0A2E24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await getCachedStore('hh');
  const storefrontConfig = resolveStorefrontConfig(store?.settings?.storefront);

  return (
    <html lang="en" className={`h-full ${fraunces.variable} ${inter.variable}`}>
      <head>
        <ThemeInjector theme={storefrontConfig.theme} />
      </head>
      <body className="min-h-full flex flex-col pb-16 md:pb-0 font-sans">
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <ToastProvider>
                <AttributionTracker />
                <OfflineBanner />
                {children}
                <CartDrawer />
                <MobileNav />
                <SearchOverlay />
                <PwaRegister />
              </ToastProvider>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
