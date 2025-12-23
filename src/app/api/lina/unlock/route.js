import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import LinaUnlock from '@/models/LinaUnlock';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';

const UNLOCK_COST = 1000; // ETB

export async function POST(request) {
    try {
        // Require authentication
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { profileId } = await request.json();

        if (!profileId) {
            return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
        }

        // Check if profile exists
        const profile = await LinaProfile.findById(profileId);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Check if already unlocked
        const existingUnlock = await LinaUnlock.findOne({
            profileId,
            userId: user._id,
            status: 'approved'
        });

        if (existingUnlock) {
            return NextResponse.json({
                error: 'You have already unlocked this profile'
            }, { status: 400 });
        }

        // Fetch user's current balance
        const userDoc = await User.findById(user._id);
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (userDoc.balance < UNLOCK_COST) {
            return NextResponse.json({
                error: `Insufficient balance. You need ${UNLOCK_COST} ETB. Current balance: ${userDoc.balance} ETB.`
            }, { status: 400 });
        }

        // Deduct balance
        userDoc.balance -= UNLOCK_COST;
        await userDoc.save();

        // Create unlock record (auto-approved)
        const unlock = new LinaUnlock({
            profileId,
            userId: user._id,
            amountPaid: UNLOCK_COST,
            status: 'approved'
        });
        await unlock.save();

        return NextResponse.json({
            success: true,
            message: `Profile unlocked! ${UNLOCK_COST} ETB deducted from your balance.`,
            newBalance: userDoc.balance
        });

    } catch (error) {
        console.error('Error unlocking profile:', error);

        // Handle duplicate unlock attempts
        if (error.code === 11000) {
            return NextResponse.json({
                error: 'You have already unlocked this profile'
            }, { status: 400 });
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
