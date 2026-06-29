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
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
}

export default nextConfig
