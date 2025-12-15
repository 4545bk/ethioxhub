import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        envCheck: {
            MONGODB_URI: !!process.env.MONGODB_URI,
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            AWS_REGION: process.env.AWS_REGION,
            AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
            NODE_ENV: process.env.NODE_ENV,
        }
    });
}
