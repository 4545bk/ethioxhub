'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('referralCode', ref);
        }

        // Track social share links (for share rewards)
        const share = searchParams.get('share');
        if (share) {
            localStorage.setItem('shareCode', share);
        }
    }, [searchParams]);

    return null;
}
