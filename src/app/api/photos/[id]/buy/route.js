import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import Photo from '@/models/Photo';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/db';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const photo = await Photo.findById(params.id);
        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        if (!photo.isPaid) {
            return NextResponse.json({ error: 'Photo is free' }, { status: 400 });
        }

        // Fetch fresh user data to check balance and unlocks
        const freshUser = await User.findById(user._id);
        if (!freshUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already unlocked
        if (freshUser.unlockedPhotos && freshUser.unlockedPhotos.includes(photo._id)) {
            return NextResponse.json({ success: true, message: 'Already unlocked' });
        }

        if (freshUser.balance < photo.price) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
        }

        // Process Purchase
        freshUser.balance -= photo.price;
        if (!freshUser.unlockedPhotos) freshUser.unlockedPhotos = [];
        freshUser.unlockedPhotos.push(photo._id);

        if (!freshUser.notifications) freshUser.notifications = [];
        // Add Notification
        freshUser.notifications.push({
            type: 'success',
            message: `You successfully unlocked "${photo.title}"`,
            read: false
        });

        await freshUser.save();

        // Create Transaction
        await Transaction.create({
            userId: user._id,
            amount: -photo.price,
            type: 'purchase',
            status: 'approved',
            metadata: {
                photoId: photo._id,
                ownerId: photo.owner,
                photoTitle: photo.title,
                notes: `Purchased photo: ${photo.title}`
            }
        });

        return NextResponse.json({ success: true, balance: freshUser.balance });
    } catch (error) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
    }
}
