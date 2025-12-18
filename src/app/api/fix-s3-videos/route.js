import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Video from '@/models/Video';

export async function POST(req) {
    try {
        await dbConnect();

        // Step 1: Add videoUrl to S3 videos that have s3Key but no videoUrl
        const videosToUpdate = await Video.find({
            provider: 's3',
            s3Key: { $exists: true, $ne: null },
            videoUrl: { $exists: false }
        });

        let urlUpdated = 0;
        for (const video of videosToUpdate) {
            video.videoUrl = `https://ethioxhub.s3.eu-north-1.amazonaws.com/${video.s3Key}`;
            await video.save();
            urlUpdated++;
        }

        // Step 2: Add duration to S3 videos that don't have it
        const durationResult = await Video.updateMany(
            {
                provider: 's3',
                $or: [
                    { duration: { $exists: false } },
                    { duration: null },
                    { duration: 0 }
                ]
            },
            { $set: { duration: 120 } }
        );

        return NextResponse.json({
            success: true,
            message: 'S3 videos fixed successfully!',
            urlsAdded: urlUpdated,
            durationsAdded: durationResult.modifiedCount,
            details: {
                videosWithUrlAdded: urlUpdated,
                videosWithDurationAdded: durationResult.modifiedCount
            }
        });

    } catch (error) {
        console.error('Fix S3 Videos Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
