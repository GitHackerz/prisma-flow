import path from 'node:path'
import type { NextConfig } from 'next'

const workspaceRoot = path.resolve(process.cwd(), '../..')

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactCompiler: true,
  images: { unoptimized: true },
  turbopack: {
    root: workspaceRoot,
  },
  // Allow the dashboard to be embedded in the CLI under any path prefix
  // (set at build time via NEXT_PUBLIC_BASE_PATH env var)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
}

export default nextConfig
