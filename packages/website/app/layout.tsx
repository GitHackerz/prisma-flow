import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrismaFlow - Visual Prisma Migration Safety',
  description:
    'Detect schema drift, analyze migration risks, and ship database changes safely. Open-source CLI + web dashboard for Prisma.',
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
    title: 'PrismaFlow - Visual Prisma Migration Safety',
    description: 'Detect schema drift, analyze migration risks, and ship database changes safely.',
    type: 'website',
    siteName: 'PrismaFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrismaFlow - Visual Prisma Migration Safety',
    description: 'Detect schema drift, analyze migration risks, and ship database changes safely.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e1a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">{children}</body>
    </html>
  )
}
