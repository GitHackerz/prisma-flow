import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output:        'export',
  trailingSlash: true,
  reactCompiler: true,
  images:        { unoptimized: true },
  // Allow the dashboard to be embedded in the CLI under any path prefix
  // (set at build time via NEXT_PUBLIC_BASE_PATH env var)
  basePath:      process.env['NEXT_PUBLIC_BASE_PATH'] ?? '',
}

export default nextConfig