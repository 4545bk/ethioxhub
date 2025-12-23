import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import LinaUnlock from '@/models/LinaUnlock';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
    try {
        await connectDB();

        // Check if user is logged in (optional - can view blurred even when logged out)
        const authHeader = request.headers.get('authorization');
        let userId = null;

        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                userId = decoded.userId;
            } catch (err) {
                // Token invalid or expired - treat as guest
                userId = null;
            }
        }

        // Fetch all active profiles
        const profiles = await LinaProfile.find({ isActive: true }).lean();

        // Blur phone numbers helper
        const blurPhoneNumber = (number) => {
            if (!number) return 'N/A';
            return number.slice(0, 2) + 'XXXXXXX';
        };

        // Add unlock status for each profile
        const profilesWithStatus = await Promise.all(
            profiles.map(async (profile) => {
                const unlock = userId
                    ? await LinaUnlock.findOne({
                        profileId: profile._id,
                        userId,
                        status: 'approved'
                    })
                    : null;

                const isUnlocked = !!unlock;

                return {
                    _id: profile._id,
                    name: profile.name,
                    age: profile.age,
                    country: profile.country,
                    city: profile.city,
                    neighborhood: profile.neighborhood,
                    localSalary: profile.localSalary,
                    intlSalary: profile.intlSalary,
                    // Apply Cloudinary blur transformation if not unlocked
                    photoUrl: isUnlocked
                        ? profile.photoUrl
                        : profile.photoUrl.replace('/upload/', '/upload/e_blur:1000/'),
                    additionalPhotos: isUnlocked ? profile.additionalPhotos || [] : [],
                    contactInfo: isUnlocked ? profile.contactInfo : blurPhoneNumber(profile.contactInfo),
                    telegramUsername: isUnlocked ? profile.telegramUsername : null,
                    voiceId: profile.voiceId,
                    isUnlocked,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: profilesWithStatus
        });

    } catch (error) {
        console.error('Error fetching Lina profiles:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
