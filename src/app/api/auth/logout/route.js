/**
 * Logout API Route
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
    const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully',
    });

    // Clear refresh token cookie
    response.cookies.delete('refreshToken');

    return response;
}
