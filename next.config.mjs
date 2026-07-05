/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Keep build from failing the whole project on lint warnings during early phases.
  // Tightened once the codebase stabilizes.
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
