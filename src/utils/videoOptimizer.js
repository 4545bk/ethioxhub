/**
 * Optimizes Cloudinary Video URLs for mobile performance and fast playback
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - The optimized URL with transformation parameters
 */
export const optimizeCloudinaryVideoUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Split URL to insert transformations
    // Pattern: /upload/v<version>/<id>
    // We want: /upload/q_auto,f_auto,vc_h264:baseline,w_854,c_limit/v<version>/<id>

    // 1. Check if we already have transformations (avoid double adding)
    if (url.includes('q_auto')) return url;

    // 2. Performance settings:
    // f_auto: Best format (WebM/MP4)
    // q_auto:economy : Aggressive compression for speed (good for mobile)
    // vc_h264:baseline : Easiest to decode for phones
    // w_854,c_limit : Max width 480p/720p (saves bandwidth)
    const transformations = 'f_auto,q_auto:economy,vc_h264:baseline,w_854,c_limit';

    return url.replace('/upload/', `/upload/${transformations}/`);
};
