/**
 * Test Video Model API
 * GET /api/test/video-model
 * 
 * Tests if S3 videos can be created without cloudinaryPublicId
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';

export async function GET(request) {
    try {
        await connectDB();

        // Get the Video schema to inspect it
        const schema = Video.schema;
        const cloudinaryPublicIdField = schema.paths.cloudinaryPublicId;

        return NextResponse.json({
            success: true,
            message: 'Video model loaded successfully',
            modelInfo: {
                hasPreSaveHook: schema._pres && schema._pres.has('save'),
                cloudinaryPublicId: {
                    type: cloudinaryPublicIdField.instance,
                    required: cloudinaryPublicIdField.isRequired,
                    unique: cloudinaryPublicIdField._index?.unique,
                    sparse: cloudinaryPublicIdField._index?.sparse,
                },
                s3Key: {
                    type: schema.paths.s3Key.instance,
                    required: schema.paths.s3Key.isRequired,
                },
            },
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        console.error('Test video model error:', err);
        return NextResponse.json(
            { error: 'Test failed', message: err.message },
            { status: 500 }
        );
    }
}
