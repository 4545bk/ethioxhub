/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    },
    // Force dynamic rendering for API routes
    experimental: {
        serverActions: true,
    },
    // Disable static optimization for routes that need dynamic data
    output: 'standalone',
};

export default nextConfig;
