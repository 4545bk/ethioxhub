/**
 * useVideoPreview Hook
 * Manages video preview URL fetching for hover preview
 * Enhanced to work with ALL videos regardless of storage provider
 * Now with comprehensive debugging and error handling
 */

import { useState, useEffect } from 'react';

export function useVideoPreview(video) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!video) return;

        const fetchPreviewUrl = async () => {
            setLoading(true);
            setError(null);

            try {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dyztnlzzt';

                // Debug logging - only show first time per video
                const debugKey = `preview_debug_${video._id}`;
                const hasLogged = typeof window !== 'undefined' && sessionStorage.getItem(debugKey);

                if (!hasLogged && typeof window !== 'undefined') {
                    console.log('[Preview Debug]', {
                        title: video.title?.substring(0, 40),
                        provider: video.provider,
                        hasPreviewUrl: !!video.previewUrl,
                        hasCloudinaryPublicId: !!video.cloudinaryPublicId,
                        hasCloudinaryUrl: !!video.cloudinaryUrl,
                        hasCloudinaryHlsUrl: !!video.cloudinaryHlsUrl,
                        hasThumbnailUrl: !!video.thumbnailUrl,
                        duration: video.duration
                    });
                    sessionStorage.setItem(debugKey, 'true');
                }

                // Priority 1: If explicit preview URL exists, use it
                if (video.previewUrl) {
                    const httpsUrl = video.previewUrl.startsWith('http://')
                        ? video.previewUrl.replace('http://', 'https://')
                        : video.previewUrl;
                    console.log('[Preview] Using explicit previewUrl:', httpsUrl.substring(0, 60));
                    setPreviewUrl(httpsUrl);
                    setLoading(false);
                    return;
                }

                // Priority 2: For Cloudinary videos with publicId, generate optimized preview
                if (video.cloudinaryPublicId) {
                    // Adjust preview duration based on video length
                    const previewDuration = video.duration && video.duration < 5 ? Math.max(2, Math.floor(video.duration)) : 5;
                    const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_${previewDuration},f_auto,q_auto:low,w_400/${video.cloudinaryPublicId}.mp4`;
                    console.log('[Preview] Generated from cloudinaryPublicId:', preview.substring(0, 80));
                    setPreviewUrl(preview);
                    setLoading(false);
                    return;
                }

                // Priority 3: For Cloudinary videos with cloudinaryUrl
                if (video.cloudinaryUrl) {
                    // Try to extract public ID from the URL with improved regex
                    const urlMatch = video.cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.(mp4|webm|mov|avi|flv)/i);
                    if (urlMatch && urlMatch[1]) {
                        const publicId = urlMatch[1];
                        const previewDuration = video.duration && video.duration < 5 ? Math.max(2, Math.floor(video.duration)) : 5;
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_${previewDuration},f_auto,q_auto:low,w_400/${publicId}.mp4`;
                        console.log('[Preview] Extracted from cloudinaryUrl:', preview.substring(0, 80));
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }

                    // If extraction fails, use cloudinaryUrl directly (ensure HTTPS)
                    const httpsUrl = video.cloudinaryUrl.startsWith('http://')
                        ? video.cloudinaryUrl.replace('http://', 'https://')
                        : video.cloudinaryUrl;
                    console.log('[Preview] Using cloudinaryUrl directly (fallback):', httpsUrl.substring(0, 60));
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
                        const previewDuration = video.duration && video.duration < 5 ? Math.max(2, Math.floor(video.duration)) : 5;
                        const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_${previewDuration},f_auto,q_auto:low,w_400/${publicId}.mp4`;
                        console.log('[Preview] Generated from HLS URL:', preview.substring(0, 80));
                        setPreviewUrl(preview);
                        setLoading(false);
                        return;
                    }

                    // Note: HLS URLs typically won't work in <video> tags without HLS.js
                    console.warn('[Preview] HLS URL found but cannot extract ID:', video.cloudinaryHlsUrl.substring(0, 60));
                }


                // Priority 5: For S3 videos - use full video URL with time control
                if (video.provider === 's3') {
                    // S3 doesn't support transformations, so we use the full video URL
                    // and control playback time in the component (0-5 seconds)

                    // Try multiple S3 URL sources
                    let s3VideoUrl = null;

                    // Option 1: Direct videoUrl field
                    if (video.videoUrl) {
                        s3VideoUrl = video.videoUrl;
                    }
                    // Option 2: Construct from s3Key and s3Bucket
                    else if (video.s3Key && video.s3Bucket) {
                        // Construct S3 URL
                        const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
                        s3VideoUrl = `https://${video.s3Bucket}.s3.${region}.amazonaws.com/${video.s3Key}`;
                    }
                    // Option 3: Look for any URL-like field
                    else if (video.url) {
                        s3VideoUrl = video.url;
                    }

                    if (s3VideoUrl) {
                        // Ensure HTTPS
                        const httpsUrl = s3VideoUrl.startsWith('http://')
                            ? s3VideoUrl.replace('http://', 'https://')
                            : s3VideoUrl;

                        console.log('[Preview] Using S3 video URL (time-controlled):', httpsUrl.substring(0, 60));
                        setPreviewUrl(httpsUrl);
                        setLoading(false);
                        return;
                    } else {
                        console.warn('[Preview] S3 video found but no URL available:', {
                            hasVideoUrl: !!video.videoUrl,
                            hasS3Key: !!video.s3Key,
                            hasS3Bucket: !!video.s3Bucket,
                            hasUrl: !!video.url
                        });
                        setPreviewUrl(null);
                        setLoading(false);
                        return;
                    }
                }


                // Priority 6: Try to construct from thumbnail URL (last resort for Cloudinary)
                if (video.thumbnailUrl && video.thumbnailUrl.includes('cloudinary')) {
                    // Try multiple regex patterns to extract public ID from thumbnail
                    const patterns = [
                        /\/upload\/(?:v\d+\/)?(.+?)\.(jpg|png|webp|jpeg)/i,
                        /\/image\/upload\/(?:v\d+\/)?(.+?)$/i,
                        /cloudinary\.com\/[^\/]+\/[^\/]+\/upload\/(.+?)\.(jpg|png|webp|jpeg)/i
                    ];

                    for (const pattern of patterns) {
                        const urlMatch = video.thumbnailUrl.match(pattern);
                        if (urlMatch && urlMatch[1]) {
                            // Remove image extension and try as video
                            const publicId = urlMatch[1].replace(/\.(jpg|png|webp|jpeg)$/i, '');
                            const previewDuration = video.duration && video.duration < 5 ? Math.max(2, Math.floor(video.duration)) : 5;
                            const preview = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,du_${previewDuration},f_auto,q_auto:low,w_400/${publicId}.mp4`;
                            console.log('[Preview] Derived from thumbnail URL:', preview.substring(0, 80));
                            setPreviewUrl(preview);
                            setLoading(false);
                            return;
                        }
                    }
                    console.warn('[Preview] Could not extract ID from thumbnail:', video.thumbnailUrl.substring(0, 60));
                }

                // Last resort: No preview available
                console.warn('[Preview] No preview available for video:', video.title?.substring(0, 40));
                setPreviewUrl(null);
                setLoading(false);

            } catch (error) {
                console.error('[Preview Error]:', error.message, 'Video:', video.title?.substring(0, 40));
                setError(error.message);
                setPreviewUrl(null);
                setLoading(false);
            }
        };

        fetchPreviewUrl();
    }, [video]);

    return { previewUrl, loading, error };
}
