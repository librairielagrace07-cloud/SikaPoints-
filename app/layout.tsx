import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ThemeProvider } from '@/lib/providers/theme-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'SikaPoints',
  description: 'Gérez vos points Mobile Money — UV, transactions, rapports',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SikaPoints',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// Script exécuté avant hydration pour éviter le flash de mauvais thème
const themeScript = `(function(){try{var t=localStorage.getItem('sika-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
