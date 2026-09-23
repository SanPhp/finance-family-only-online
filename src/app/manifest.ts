import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance Family',
    short_name: 'Família$',
    description: 'Controle financeiro da família',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f3fb',
    theme_color: '#6d28d9',
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
