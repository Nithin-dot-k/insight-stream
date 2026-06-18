/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to treat pdf-parse as a server-side library
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;