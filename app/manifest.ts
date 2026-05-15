// app/manifest.ts
//
// Next.js 14 metadata manifest. Wordt automatisch geserveerd op
// /manifest.webmanifest en wordt door de RootLayout metadata-resolver
// als <link rel="manifest"> ingevoegd. Geen handmatige link nodig.
//
// V0 Gap 5a: installable PWA.

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'MarketGrow',
    short_name:       'MarketGrow',
    description:      'AI-powered ecommerce intelligence for early-stage entrepreneurs',
    start_url:        '/dashboard',
    scope:            '/',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#0f172a',
    theme_color:      '#4f46e5',
    categories:       ['business', 'productivity', 'finance'],
    lang:             'en',
    dir:              'ltr',
    icons: [
      {
        src:     '/icons/icon-192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-192-maskable.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'maskable',
      },
      {
        src:     '/icons/icon-512-maskable.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
