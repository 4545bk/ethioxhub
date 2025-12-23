import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';
import { requireAdmin, getOptionalUser } from '@/lib/middleware';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const skip = (page - 1) * limit;

        const query = { status: 'active' };

        // Populate owner and handle likes logic (maybe just count)
        const [photos, total] = await Promise.all([
            Photo.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('owner', 'username profilePicture')
                .populate('relatedVideo', 'title')
                .lean(), // Use lean for performance
            Photo.countDocuments(query)
        ]);

        // Since we are using lean needed to check things manually? 
        // We probably want to know "isLiked" by current user.
        // Get current user optionally
        const user = await getOptionalUser(request);

        const enhancedPhotos = photos.map(p => ({
            ...p,
            isLiked: user ? p.likes.some(id => id.toString() === user._id.toString()) : false,
            likesCount: p.likes.length,
            likes: undefined, // Hide raw array
            canView: !p.isPaid ||
                (user && user.roles && user.roles.includes('admin')) ||
                (user && user.unlockedPhotos && user.unlockedPhotos.some(id => id.toString() === p._id.toString()))
        }));

        return NextResponse.json({
            success: true,
            photos: enhancedPhotos,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await requireAdmin(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const body = await request.json();

        const { title, description, url, isPaid, price, album, relatedVideo, customLink } = body;

        if (!title || !url) {
            return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
        }

        const photo = await Photo.create({
            owner: auth.user._id,
            title,
            description,
            url,
            album: album || [], // Store album array
            isPaid: !!isPaid,
            price: price ? parseInt(price) : 0,
            status: 'active',
            relatedVideo: relatedVideo || undefined,
            customLink: customLink || undefined
        });

        // Add 'likes' as empty array for response consistency if needed
        const responsePhoto = photo.toObject();
        responsePhoto.likesCount = 0;

        return NextResponse.json({ success: true, photo: responsePhoto }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to create photo' }, { status: 500 });
    }
}
