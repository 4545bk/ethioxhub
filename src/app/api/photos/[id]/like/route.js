import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';
import { requireAuth } from '@/lib/middleware';

export async function POST(request, { params }) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        await connectDB();

        const photo = await Photo.findById(id);
        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        const userIdStr = user._id.toString();
        const likeIndex = photo.likes.findIndex(uid => uid.toString() === userIdStr);

        let liked = false;
        if (likeIndex === -1) {
            // Like
            photo.likes.push(user._id);
            liked = true;
        } else {
            // Unlike
            photo.likes.splice(likeIndex, 1);
            liked = false;
        }

        await photo.save();

        return NextResponse.json({
            success: true,
            liked,
            likesCount: photo.likes.length
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to like photo' }, { status: 500 });
    }
}
