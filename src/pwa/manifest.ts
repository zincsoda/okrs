export const PWA_THEME_COLOR = '#4338CA'
export const PWA_BACKGROUND_COLOR = '#1E1B4B'

export const pwaManifest = {
  name: 'SRT Tech Team OKRs',
  short_name: 'OKRs',
  description: 'Internal OKR management for the SRT Technology team',
  theme_color: PWA_THEME_COLOR,
  background_color: PWA_BACKGROUND_COLOR,
  display: 'standalone' as const,
  start_url: '/',
  scope: '/',
  icons: [
    {
      src: '/pwa-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/pwa-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/pwa-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export const pwaIconAssets = [
  'app-icon.svg',
  'favicon.svg',
  'pwa-192.png',
  'pwa-512.png',
  'apple-touch-icon.png',
] as const
