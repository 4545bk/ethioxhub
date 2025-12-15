/**
 * Purchase Video API
 * POST /api/videos/[id]/purchase
 * 
 * Deducts balance and unlocks video for user
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/middleware';

export async function POST(request, { params }) {
    let session = null;
    try {
        const user = await requireAuth(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const videoId = params.id;
        await connectDB();

        // Start Transaction
        session = await mongoose.startSession();
        session.startTransaction();

        // 1. Get Video
        const video = await Video.findById(videoId).session(session);
        if (!video) throw new Error('Video not found');
        if (!video.isPaid) throw new Error('This video is free');

        // 2. Refresh User
        const dbUser = await User.findById(user._id).session(session);

        // 3. Check unlocked
        if (dbUser.unlockedVideos.includes(videoId)) {
            await session.abortTransaction();
            return NextResponse.json({ success: true, message: 'Already unlocked' });
        }

        // 4. Check Balance
        const priceCents = video.price; // Video price is stored in cents
        if (dbUser.balance < priceCents) {
            throw new Error('Insufficient balance');
        }

        // 5. Deduct & Unlock
        dbUser.balance -= priceCents;
        dbUser.unlockedVideos.push(videoId);
        await dbUser.save({ session });

        // 6. Record Transaction
        await Transaction.create([{
            userId: user._id,
            amount: -priceCents, // Negative for deduction
            type: 'purchase',
            status: 'approved',
            metadata: {
                videoId: video._id,
                videoTitle: video.title,
                ownerId: video.owner
            }
        }], { session });

        // 7. Credit Owner (Optional - if we pay creators later)
        // For now, platform keeps 100% or admin is owner logic

        await session.commitTransaction();

        return NextResponse.json({
            success: true,
            message: 'Video unlocked successfully',
            newBalance: dbUser.balance
        });

    } catch (err) {
        if (session) await session.abortTransaction();
        console.error('Purchase error:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 400 }
        );
    } finally {
        if (session) session.endSession();
    }
}
