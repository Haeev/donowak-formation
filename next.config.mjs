/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'placehold.co'],
  },
  eslint: {
    // Désactiver temporairement les vérifications ESLint pendant le build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 