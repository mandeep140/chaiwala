import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Chaiwala | Deep Productions',
  description: 'Chaiwala, a digital ledger for your chai business by Deep Productions. Track sales, manage customers and payments, and grow your business. Made with love for free forever!',
  manifest: '/manifest.json',
  icons: [
    { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chaiwala',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-background">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
