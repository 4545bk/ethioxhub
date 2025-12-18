/**
 * Get Current User API Route
 * GET /api/auth/me
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                availableBalance: user.availableBalance,
                reservedBalance: user.reservedBalance,
                roles: user.roles,
                profilePicture: user.profilePicture || '',
                verifiedAge: user.verifiedAge,
                createdAt: user.createdAt,
                isSubscriber: user.isSubscriber,
                subscriptionExpiresAt: user.subscriptionExpiresAt,
                subscriptionPlan: user.subscriptionPlan,
            },
        });
    } catch (err) {
        console.error('Get user error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
