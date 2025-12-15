/**
 * useVideoPreview Hook
 * Manages video preview URL fetching for hover preview
 * Enhanced to work with ALL videos regardless of storage provider
 */

import { useState, useEffect } from 'react';

export function useVideoPreview(video) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!video) return;

        const fetchPreviewUrl = async () => {
            setLoading(true);

            try {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dyztnlzzt';

                // Priority 1: If explicit preview URL exists, use it
                if (video.previewUrl) {
                    // Ensure HTTPS
                    const httpsUrl = video.previewUrl.startsWith('http://')
                        ? video.previewUrl.replace('http://', 'https://')
                        : video.previewUrl;
                    setPreviewUrl(httpsUrl);
                    setLoading(false);
                    return;
                }

                // Priority 2: For Cloudinary videos with publicId, generate optimized preview
                if (video.cloudinaryPublicId) {
                    // Create a 5-second preview clip starting from beginning
                    const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto:low,w_400/${video.cloudinaryPublicId}.mp4`;
                    setPreviewUrl(preview);
                    setLoading(false);
                    return;
                }

                // Priority 3: For Cloudinary videos with cloudinaryUrl
                if (video.cloudinaryUrl) {
                    // Try to extract public ID from the URL
                    const urlMatch = video.cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.(mp4|webm|mov)/i);
                    if (urlMatch && urlMatch[1]) {
                        const publicId = urlMatch[1];
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto:low,w_400/${publicId}.mp4`;
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }

                    // If extraction fails, use cloudinaryUrl directly (ensure HTTPS)
                    const httpsUrl = video.cloudinaryUrl.startsWith('http://')
                        ? video.cloudinaryUrl.replace('http://', 'https://')
                        : video.cloudinaryUrl;
                    setPreviewUrl(httpsUrl);
                    setLoading(false);
                    return;
                }

                // Priority 4: For Cloudinary HLS URLs
                if (video.cloudinaryHlsUrl) {
                    // Convert HLS to preview by extracting public ID
                    const urlMatch = video.cloudinaryHlsUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.m3u8/i);
                    if (urlMatch && urlMatch[1]) {
                        const publicId = urlMatch[1];
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto:low,w_400/${publicId}.mp4`;
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }

                    // Use HLS URL as fallback (some browsers support it)
                    const httpsUrl = video.cloudinaryHlsUrl.startsWith('http://')
                        ? video.cloudinaryHlsUrl.replace('http://', 'https://')
                        : video.cloudinaryHlsUrl;
                    setPreviewUrl(httpsUrl);
                    setLoading(false);
                    return;
                }

                // Priority 5: For S3 videos - use thumbnail as preview since S3 doesn't support transformations
                // (Hover preview on S3 videos will show animated thumbnail effect instead)
                if (video.provider === 's3') {
                    // For S3, we'll rely on the thumbnail with CSS animation
                    // Don't set previewUrl for S3 videos to avoid CORS issues
                    setPreviewUrl(null);
                    setLoading(false);
                    return;
                }

                // Priority 6: Default provider (cloudinary) - try to construct URL from any available info
                if (video.thumbnailUrl && video.thumbnailUrl.includes('cloudinary')) {
                    // Try to extract public ID from thumbnail URL
                    const urlMatch = video.thumbnailUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|png|webp)/i);
                    if (urlMatch && urlMatch[1]) {
                        // Assume video has same public ID as thumbnail
                        const publicId = urlMatch[1];
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto:low,w_400/${publicId}.mp4`;
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }
                }

                // Last resort: No preview available
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[Preview] No URL found for:', video.title?.substring(0, 30), {
                        hasPreviewUrl: !!video.previewUrl,
                        hasCloudinaryId: !!video.cloudinaryPublicId,
                        hasCloudinaryUrl: !!video.cloudinaryUrl,
                        hasHlsUrl: !!video.cloudinaryHlsUrl,
                        provider: video.provider
                    });
                }
                setPreviewUrl(null);
                setLoading(false);

            } catch (error) {
                console.error('[Preview Error]:', error.message);
                setPreviewUrl(null);
                setLoading(false);
            }
        };

        fetchPreviewUrl();
    }, [video]);

    return { previewUrl, loading };
}
