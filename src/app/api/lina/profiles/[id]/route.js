import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import LinaUnlock from '@/models/LinaUnlock';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;

        // Find profile
        const profile = await LinaProfile.findById(id).lean();

        if (!profile || !profile.isActive) {
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Check if user is authenticated
        const authHeader = request.headers.get('authorization');
        let userId = null;
        let isUnlocked = false;

        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                userId = decoded.userId;

                // Check if user has unlocked this profile
                const unlock = await LinaUnlock.findOne({
                    profileId: id,
                    userId,
                    status: 'approved'
                });

                isUnlocked = !!unlock;
            } catch (err) {
                // Invalid token, treat as guest
                userId = null;
            }
        }

        // Return profile with unlock status
        const responseProfile = {
            ...profile,
            isUnlocked,
            // Blur contact info if not unlocked
            contactInfo: isUnlocked ? profile.contactInfo : profile.contactInfo?.slice(0, 2) + 'XXXXXXX',
            additionalPhotos: isUnlocked ? profile.additionalPhotos : [],
            telegramUsername: isUnlocked ? profile.telegramUsername : null
        };

        return NextResponse.json({
            success: true,
            profile: responseProfile
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
