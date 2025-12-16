/**
 * Admin Delete Video API
 * DELETE /api/admin/videos/[id]
 * Deletes video from database and storage (Cloudinary/S3)
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { requireAdmin } from '@/lib/middleware';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        // Verify admin
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Find video
        const video = await Video.findById(params.id);
        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Delete from storage based on provider
        try {
            if (video.provider === 's3' && video.s3Key) {
                // Delete from S3
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: video.s3Bucket || process.env.AWS_S3_BUCKET_NAME,
                    Key: video.s3Key,
                });
                await s3Client.send(deleteCommand);
                console.log(`✅ Deleted S3 file: ${video.s3Key}`);
            } else if (video.cloudinaryPublicId) {
                // Delete from Cloudinary
                await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
                    resource_type: 'video'
                });
                console.log(`✅ Deleted Cloudinary video: ${video.cloudinaryPublicId}`);

                // Also delete preview if exists
                if (video.previewCloudinaryId) {
                    await cloudinary.uploader.destroy(video.previewCloudinaryId, {
                        resource_type: 'video'
                    });
                }
            }
        } catch (storageError) {
            console.error('⚠️ Storage deletion failed (continuing with DB delete):', storageError);
            // Continue with database deletion even if storage deletion fails
        }

        // Delete from database
        await Video.findByIdAndDelete(params.id);

        return NextResponse.json({
            success: true,
            message: 'Video deleted successfully',
            videoId: params.id
        });

    } catch (error) {
        console.error('Delete video error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete video' },
            { status: 500 }
        );
    }
}
