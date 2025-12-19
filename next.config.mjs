/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.s3.*.amazonaws.com',
            },
        ],
    },
    // Disable static optimization for routes that need dynamic data
    output: 'standalone',
};

export default nextConfig;
