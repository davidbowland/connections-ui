/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  ...(process.env.NODE_ENV !== 'development' && { output: 'export' }),
  pageExtensions: ['ts', 'tsx'],
  trailingSlash: true,
}

module.exports = nextConfig
