/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Electron
  output: process.env.BUILD_ELECTRON ? 'export' : undefined,

  // Disable image optimization for Electron builds
  images: {
    unoptimized: process.env.BUILD_ELECTRON ? true : false,
  },

  // Base path for Electron
  basePath: process.env.BUILD_ELECTRON ? '' : undefined,
  assetPrefix: process.env.BUILD_ELECTRON ? '' : undefined,
}

module.exports = nextConfig