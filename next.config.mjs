import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    },
    // Disable static optimization for routes that need dynamic data
    output: 'standalone',

    // Explicitly configure webpack to resolve @ alias
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname, './src'),
        };
        return config;
    },
};

export default nextConfig;
