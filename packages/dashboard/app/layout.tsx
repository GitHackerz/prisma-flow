import type { Metadata, Viewport } from 'next'
import { Sidebar } from './components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrismaFlow - Migration Dashboard',
  description:
    'Visual Prisma migration management. Monitor, detect drift, and ship database changes safely.',
  keywords: ['prisma', 'migrations', 'database', 'schema drift', 'devtools'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
