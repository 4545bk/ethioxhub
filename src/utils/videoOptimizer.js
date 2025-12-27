/**
 * Optimizes Cloudinary Video URLs for adaptive streaming and fast playback
 * @param {string} url - The original Cloudinary URL
 * @param {object} options - Optimization options
 * @returns {string} - The optimized URL with transformation parameters
 */
export const optimizeCloudinaryVideoUrl = (url, options = {}) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Check if we already have transformations (avoid double adding)
    if (url.includes('q_auto') || url.includes('sp_')) return url;

    const {
        mobile = false,
        duration = 0, // Video duration in seconds
        quality = 'auto' // 'low', 'medium', 'high', 'auto'
    } = options;

    let transformations;

    // For longer videos (15+ minutes), use adaptive streaming
    if (duration > 900) { // 15 minutes
        // HLS adaptive streaming with multiple quality levels
        transformations = [
            'f_auto',
            'q_auto:good', // Better quality for desktop
            'vc_h264:main', // Better codec profile
            'sp_hd', // Streaming profile - adaptive bitrate
            'br_1m', // Initial bitrate 1 Mbps (fast start)
            'c_limit'
        ].join(',');
    } else if (mobile || duration > 300) { // 5-15 minutes or mobile
        // Balanced settings for medium-length videos
        transformations = [
            'f_auto',
            'q_auto:good',
            'vc_h264:baseline',
            'w_1280', // Max 720p
            'br_800k', // 800 kbps bitrate
            'c_limit'
        ].join(',');
    } else {
        // Short videos - can be higher quality
        transformations = [
            'f_auto',
            'q_auto:best',
            'vc_h264:main',
            'w_1920', // Support 1080p
            'c_limit'
        ].join(',');
    }

    return url.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Generate HLS streaming URL for long videos
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - HLS manifest URL
 */
export const generateHLSUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Replace extension with .m3u8 for HLS
    const hlsUrl = url.replace(/\.(mp4|mov|avi|webm)$/, '.m3u8');

    // Add streaming transformations
    const transformations = 'f_auto,q_auto,sp_hd,vc_auto';

    return hlsUrl.replace('/upload/', `/upload/${transformations}/`);
};
