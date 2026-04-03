import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Quick QR - Fast Barcode & QR Scanner PWA',
  description: 'Fast, offline-capable barcode and QR code scanner for iOS, Android, and desktop with full-featured history and settings management.',
  manifest: '/manifest.json',
  generator: 'v0.app',
  keywords: ['barcode', 'qr code', 'scanner', 'pwa', 'offline'],
  authors: [{ name: 'Quick QR' }],
  icons: {
    icon: [
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon-180x180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quick QR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0d0013',
  userScalable: true,
}

import { ThemeProvider } from '@/components/ThemeProvider'

import { Navigation } from '@/components/Navigation'

import { ProgressBar } from '@/components/ProgressBar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Quick QR" />
        <meta name="msapplication-TileColor" content="#0d0013" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background overscroll-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ProgressBar />
          <div className="relative flex flex-col h-[100svh] overflow-hidden">
            <main className="flex-1 overflow-y-auto pb-20">
              {children}
            </main>
            <Navigation />
          </div>
          <Toaster closeButton richColors position="top-center" />
          <Analytics />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('[SW] Registered successfully');
                      },
                      function(err) {
                        console.error('[SW] Registration failed: ', err);
                      }
                    );
                  });
                }
              `
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
