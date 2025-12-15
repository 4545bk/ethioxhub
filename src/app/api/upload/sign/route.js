/**
 * Sign Upload API
 * GET /api/upload/sign
 * 
 * Returns signed parameters for Cloudinary or AWS S3 upload
 */

import { NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary';
import { generateS3UploadUrl } from '@/lib/s3';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const resourceType = searchParams.get('resource_type') || 'video';
        const provider = searchParams.get('provider') || 'cloudinary';
        const fileName = searchParams.get('file_name') || 'unknown';
        const fileType = searchParams.get('file_type') || 'video/mp4';

        if (provider === 's3') {
            // S3 Signature
            const { uploadUrl, publicUrl, key } = await generateS3UploadUrl(fileName, fileType);
            return NextResponse.json({ uploadUrl, publicUrl, key, provider: 's3' });
        }

        // Cloudinary Signature (Default)
        // We use a folder 'ethioxhub_videos' for consistency
        const params = generateUploadSignature({
            folder: resourceType === 'image' ? 'ethioxhub_thumbnails' : 'ethioxhub_videos'
        });

        return NextResponse.json({ ...params, provider: 'cloudinary' });

    } catch (err) {
        console.error('Sign upload error:', err);
        return NextResponse.json({ error: err.message }, { status: 401 });
    }
}
