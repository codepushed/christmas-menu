/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode in development to prevent double API calls
  reactStrictMode: false,
  
  // Increase the body parser size limit for API routes
  experimental: {
    serverComponentsExternalPackages: ['formidable']
  }
}

module.exports = nextConfig
