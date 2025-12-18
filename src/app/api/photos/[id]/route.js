import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';
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
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function DELETE(request, { params }) {
    const auth = await requireAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        await connectDB();
        const { id } = params;
        const photo = await Photo.findById(id);

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        // Delete from storage based on URL
        try {
            // Check if it's a Cloudinary URL
            if (photo.url?.includes('cloudinary.com')) {
                // Extract public_id from Cloudinary URL
                const urlParts = photo.url.split('/upload/');
                if (urlParts[1]) {
                    const pathParts = urlParts[1].split('/');
                    // Remove version (v1234...) if present and get the rest
                    const startIdx = pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1)) ? 1 : 0;
                    const publicId = pathParts.slice(startIdx).join('/').replace(/\.[^.]+$/, ''); // Remove extension

                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'image'
                    });
                    console.log(`✅ Deleted Cloudinary photo: ${publicId}`);
                }
            }
            // Check if it's an S3 URL
            else if (photo.url?.includes('.s3.') || photo.url?.includes('s3.amazonaws.com')) {
                // Extract S3 key from URL
                const urlObj = new URL(photo.url);
                const s3Key = urlObj.pathname.substring(1); // Remove leading /
                const bucketMatch = photo.url.match(/https?:\/\/([^.]+)\.s3/);
                const bucket = bucketMatch ? bucketMatch[1] : process.env.AWS_S3_BUCKET_NAME;

                const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: s3Key,
                });
                await s3Client.send(deleteCommand);
                console.log(`✅ Deleted S3 photo: ${s3Key}`);
            }

            // Also delete thumbnail if exists and is different from main URL
            if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.url) {
                if (photo.thumbnailUrl.includes('cloudinary.com')) {
                    const urlParts = photo.thumbnailUrl.split('/upload/');
                    if (urlParts[1]) {
                        const pathParts = urlParts[1].split('/');
                        const startIdx = pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1)) ? 1 : 0;
                        const publicId = pathParts.slice(startIdx).join('/').replace(/\.[^.]+$/, '');
                        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                        console.log(`✅ Deleted Cloudinary thumbnail: ${publicId}`);
                    }
                } else if (photo.thumbnailUrl.includes('.s3.') || photo.thumbnailUrl.includes('s3.amazonaws.com')) {
                    const urlObj = new URL(photo.thumbnailUrl);
                    const s3Key = urlObj.pathname.substring(1);
                    const bucketMatch = photo.thumbnailUrl.match(/https?:\/\/([^.]+)\.s3/);
                    const bucket = bucketMatch ? bucketMatch[1] : process.env.AWS_S3_BUCKET_NAME;

                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: s3Key,
                    });
                    await s3Client.send(deleteCommand);
                    console.log(`✅ Deleted S3 thumbnail: ${s3Key}`);
                }
            }
        } catch (storageError) {
            console.error('⚠️ Storage deletion failed (continuing with DB delete):', storageError);
            // Continue with database deletion even if storage deletion fails
        }

        // Delete from database
        await Photo.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Photo and associated files deleted successfully'
        });
    } catch (err) {
        console.error('Delete photo error:', err);
        return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const auth = await requireAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const updateData = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.url !== undefined) updateData.url = body.url;
        if (body.isPaid !== undefined) updateData.isPaid = body.isPaid;
        if (body.price !== undefined) updateData.price = body.price;

        const photo = await Photo.findByIdAndUpdate(id, updateData, { new: true });

        if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

        return NextResponse.json({ success: true, photo });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
    }
}
