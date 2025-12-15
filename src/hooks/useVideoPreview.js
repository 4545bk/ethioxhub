/**
 * useVideoPreview Hook
 * Manages video preview URL fetching for hover preview
 * High-performance version with minimal logging
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
                // Priority 1: If explicit preview URL exists, use it
                if (video.previewUrl) {
                    setPreviewUrl(video.previewUrl);
                    setLoading(false);
                    return;
                }

                // Priority 2: For Cloudinary videos with publicId, generate optimized preview
                if (video.provider === 'cloudinary' && video.cloudinaryPublicId) {
                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
                    const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto/${video.cloudinaryPublicId}.mp4`;
                    setPreviewUrl(preview);
                    setLoading(false);
                    return;
                }

                // Priority 3: For Cloudinary videos with videoUrl (direct transformation URL)
                if (video.provider === 'cloudinary' && video.videoUrl) {
                    // Extract public ID from URL if possible and create preview
                    const urlMatch = video.videoUrl.match(/\/v\d+\/(.+?)\./);
                    if (urlMatch && urlMatch[1]) {
                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
                        const publicId = urlMatch[1];
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_5,f_auto,q_auto/${publicId}.mp4`;
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }
                    // If extraction fails, use original URL
                    setPreviewUrl(video.videoUrl);
                    setLoading(false);
                    return;
                }

                // Priority 4: For S3 videos with videoUrl
                if (video.provider === 's3' && video.videoUrl) {
                    setPreviewUrl(video.videoUrl);
                    setLoading(false);
                    return;
                }

                // Priority 5: Fallback to any videoUrl field (for videos without explicit provider)
                if (video.videoUrl) {
                    setPreviewUrl(video.videoUrl);
                    setLoading(false);
                    return;
                }

                // Priority 6: Check for alternative video fields
                if (video.url) {
                    setPreviewUrl(video.url);
                    setLoading(false);
                    return;
                }

                // Priority 7: Check cloudinaryUrl field (some videos might use this)
                if (video.cloudinaryUrl) {
                    setPreviewUrl(video.cloudinaryUrl);
                    setLoading(false);
                    return;
                }

                // No preview available - only log in development
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[Preview] No URL found for:', video.title?.substring(0, 30));
                }
                setPreviewUrl(null);
                setLoading(false);

            } catch (error) {
                // Only log actual errors
                console.error('[Preview Error]:', error.message);
                // Last resort fallback
                if (video.videoUrl || video.url || video.cloudinaryUrl) {
                    setPreviewUrl(video.videoUrl || video.url || video.cloudinaryUrl);
                } else {
                    setPreviewUrl(null);
                }
                setLoading(false);
            }
        };

        fetchPreviewUrl();
    }, [video]);

    return { previewUrl, loading };
}
