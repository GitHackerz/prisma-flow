import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrismaFlow — Visual Prisma Migration Management',
  description:
    'Detect schema drift, analyse migration risks, and ship database changes safely. Open-source CLI + web dashboard for Prisma.',
  keywords: [
    'prisma',
    'migrations',
    'database',
    'schema drift',
    'devtools',
    'cli',
    'dashboard',
    'open source',
  ],
  openGraph: {
    title: 'PrismaFlow — Visual Prisma Migration Management',
    description: 'Detect schema drift, analyse migration risks, and ship database changes safely.',
    type: 'website',
    siteName: 'PrismaFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrismaFlow — Visual Prisma Migration Management',
    description: 'Detect schema drift, analyse migration risks, and ship database changes safely.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e1a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  )
}
