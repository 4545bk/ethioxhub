/**
 * Cloudinary Integration
 * Signed uploads, webhook verification, and HLS URL generation
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Generate upload signature for client-side direct upload
 * @param {object} params - Upload parameters
 * @returns {object} Signature data
 */
export function generateUploadSignature(params = {}) {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Merge with default params
    const uploadParams = {
        timestamp,
        ...params,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
        uploadParams,
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        signature,
        timestamp,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        ...uploadParams,
    };
}

/**
 * Generate signed upload params for deposit screenshots
 * @param {string} userId - User ID for folder organization
 * @returns {object} Upload parameters
 */
export function getDepositUploadParams(userId) {
    return generateUploadSignature({
        folder: `deposits/${userId}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        allowed_formats: 'jpg,png,jpeg,webp',
        // Note: max_file_size and resource_type are sent as unsigned parameters
    });
}

/**
 * Generate signed upload params for videos with HLS transformation
 * @param {string} userId - User ID
 * @returns {object} Upload parameters
 */
export function getVideoUploadParams(userId) {
    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 500;

    return generateUploadSignature({
        folder: `videos/${userId}`,
        resource_type: 'video',
        max_file_size: maxSize * 1024 * 1024,
        // Eager transformations for HLS and thumbnail
        eager: [
            {
                format: 'm3u8',
                streaming_profile: 'hd',
            },
            {
                format: 'jpg',
                width: 640,
                height: 360,
                crop: 'fill',
                gravity: 'auto',
                start_offset: '0',
            },
        ],
        eager_async: true,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cloudinary/webhook`,
    });
}

/**
 * Verify Cloudinary webhook signature
 * @param {object} body - Webhook body
 * @param {string} timestamp - X-Cld-Timestamp header
 * @param {string} signature - X-Cld-Signature header
 * @returns {boolean} True if valid
 */
export function verifyWebhookSignature(body, timestamp, signature) {
    if (!timestamp || !signature) {
        return false;
    }

    // Check timestamp is recent (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
        console.error('Webhook timestamp too old');
        return false;
    }

    // Compute expected signature
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedSignature = crypto
        .createHmac('sha256', process.env.CLOUDINARY_API_SECRET)
        .update(bodyString + timestamp)
        .digest('hex');

    return signature === expectedSignature;
}

/**
 * Generate signed HLS URL with expiry
 * @param {string} publicId - Cloudinary public ID
 * @param {number} expiresIn - Expiry in seconds (default 15 min)
 * @returns {string} Signed URL
 */
export function generateSignedHlsUrl(publicId, expiresIn = 900) {
    const expiry = Math.floor(Date.now() / 1000) + expiresIn;

    return cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'm3u8',
        streaming_profile: 'hd',
        sign_url: true,
        type: 'authenticated',
        expires_at: expiry,
    });
}

/**
 * Generate signed image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformation - Transformation params
 * @returns {string} Signed URL
 */
export function generateSignedImageUrl(publicId, transformation = {}) {
    return cloudinary.url(publicId, {
        resource_type: 'image',
        sign_url: true,
        type: 'authenticated',
        ...transformation,
    });
}

/**
 * Delete resource from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' | 'video'
 * @returns {Promise<object>} Deletion result
 */
export async function deleteResource(publicId, resourceType = 'image') {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
        });
        return result;
    } catch (err) {
        console.error('Cloudinary delete error:', err);
        throw err;
    }
}

/**
 * Get video metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Video metadata
 */
export async function getVideoMetadata(publicId) {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'video',
        });

        return {
            duration: result.duration,
            width: result.width,
            height: result.height,
            format: result.format,
            fileSize: result.bytes,
            url: result.secure_url,
            thumbnail: result.derived?.[0]?.secure_url, // First eager transformation
            hlsUrl: result.derived?.find(d => d.format === 'm3u8')?.secure_url,
        };
    } catch (err) {
        console.error('Cloudinary metadata error:', err);
        throw err;
    }
}

export default cloudinary;
