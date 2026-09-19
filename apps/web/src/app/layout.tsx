import { CartDrawer } from '@/components/cart/CartDrawer';
import { AttributionTracker } from '@/components/layout/AttributionTracker';
import { MobileNav } from '@/components/layout/MobileNav';
import { PwaRegister } from '@/components/layout/PwaRegister';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '../lib/polyfill-crypto';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'H&H — Curated Modest Essentials & Jewelry',
    template: '%s | H&H'
  },
  description: 'Refined modest wear accessories and essentials crafted with precision and purpose.',
  metadataBase: new URL(process.env['APP_URL'] ?? 'http://localhost:3000'),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  },
  openGraph: {
    title: 'H&H — Curated Modest Essentials & Jewelry',
    description:
      'Refined modest wear accessories and essentials crafted with precision and purpose.',
    type: 'website',
    siteName: 'H&H'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'H&H — Curated Modest Essentials & Jewelry',
    description:
      'Refined modest wear accessories and essentials crafted with precision and purpose.'
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <AuthProvider>
          <CartProvider>
            <AttributionTracker />
            {children}
            <CartDrawer />
            <MobileNav />
            <PwaRegister />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
