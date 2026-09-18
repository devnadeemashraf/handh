import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'H&H — Curated Modest Essentials & Jewelry',
    template: '%s | H&H'
  },
  description: 'Refined modest wear accessories and essentials crafted with precision and purpose.',
  metadataBase: new URL(process.env['APP_URL'] ?? 'http://localhost:3000'),
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
  themeColor: '#0a2e24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
