import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output:        'export',
  trailingSlash: true,
  reactCompiler: true,
  images:        { unoptimized: true },
  basePath:      process.env['NEXT_PUBLIC_BASE_PATH'] ?? '',
}

export default nextConfig
