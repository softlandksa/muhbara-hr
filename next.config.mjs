/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات Next.js
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
