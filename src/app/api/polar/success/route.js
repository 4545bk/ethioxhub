/**
 * Polar Success Redirect Page
 * GET /api/polar/success
 * 
 * PURPOSE: Display success message after Polar checkout
 * IMPORTANT: Does NOT modify balance - webhook handles that
 * 
 * INTEGRATION: Display-only endpoint, safe addition
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    // Redirect to deposits page with success message
    const redirectUrl = new URL('/my-deposits', request.url);
    redirectUrl.searchParams.set('polar_success', 'true');
    if (sessionId) {
        redirectUrl.searchParams.set('session_id', sessionId);
    }

    return NextResponse.redirect(redirectUrl);
}
