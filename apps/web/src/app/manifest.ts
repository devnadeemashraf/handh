import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'H&H Luxury Atelier',
    short_name: 'H&H',
    description: 'Curated luxury essentials and refined modest accessories.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#09090b',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Catalog',
        short_name: 'Catalog',
        description: 'Explore our latest luxury arrivals',
        url: '/?category=all',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Shopping Bag',
        short_name: 'Bag',
        description: 'View items in your shopping bag',
        url: '/cart',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Check real-time order and shipment status',
        url: '/track',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Client Concierge',
        short_name: 'Concierge',
        description: 'Grievance redressal & support',
        url: '/grievance',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      }
    ]
  };
}
