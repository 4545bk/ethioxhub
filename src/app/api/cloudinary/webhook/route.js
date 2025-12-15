/**
 * Cloudinary Webhook Handler
 * POST /api/cloudinary/webhook
 * 
 * Receives notifications from Cloudinary when video processing completes.
 * Updates video status and triggers moderation if needed.
 * 
 * SECURITY: Verifies Cloudinary webhook signature
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { verifyWebhookSignature } from '@/lib/cloudinary';

export async function POST(request) {
    try {
        // Get headers for signature verification
        const signature = request.headers.get('x-cld-signature');
        const timestamp = request.headers.get('x-cld-timestamp');

        // Get raw body for signature verification
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);

        // Verify webhook signature
        if (!verifyWebhookSignature(bodyText, timestamp, signature)) {
            console.error('Invalid Cloudinary webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Process webhook
        const { notification_type, public_id, eager } = body;

        if (notification_type === 'eager') {
            // Video processing complete
            await connectDB();

            const video = await Video.findOne({ cloudinaryPublicId: public_id });

            if (!video) {
                console.warn(`Video not found for public_id: ${public_id}`);
                return NextResponse.json({ success: true });
            }

            // Update video with processed URLs
            if (eager && eager.length > 0) {
                // Find HLS URL and thumbnail
                const hlsTransform = eager.find(e => e.format === 'm3u8');
                const thumbnailTransform = eager.find(e => e.format === 'jpg');

                if (hlsTransform) {
                    video.cloudinaryHlsUrl = hlsTransform.secure_url;
                }

                if (thumbnailTransform) {
                    video.thumbnailUrl = thumbnailTransform.secure_url;
                }
            }

            // Update metadata
            if (body.duration) video.duration = body.duration;
            if (body.width) video.width = body.width;
            if (body.height) video.height = body.height;
            if (body.bytes) video.fileSize = body.bytes;
            if (body.format) video.format = body.format;

            // Move to moderation if was processing
            if (video.status === 'processing') {
                video.status = 'pending_moderation';

                // TODO: Trigger auto-moderation job here
                // await moderationQueue.add('auto-moderate', { videoId: video._id });
            }

            await video.save();

            console.log(`✅ Video updated: ${video._id} - Status: ${video.status}`);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cloudinary webhook error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
