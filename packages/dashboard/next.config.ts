import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: true,
  // we might need to disable image optimization for export
  images: {
    unoptimized: true
  }
};

export default nextConfig;