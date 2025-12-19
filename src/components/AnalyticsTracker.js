'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Generate or retrieve session ID
const getSessionId = () => {
    if (typeof window === 'undefined') return null;

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const { user } = useAuth();
    const startTimeRef = useRef(Date.now());
    const lastPathRef = useRef(pathname);

    // Track page view on route change
    useEffect(() => {
        const sessionId = getSessionId();
        if (!sessionId) return;

        // Calculate time spent on previous page
        const timeSpent = Date.now() - startTimeRef.current;

        // Send previous page duration if it's a route change
        if (lastPathRef.current !== pathname && lastPathRef.current) {
            trackEvent('page_leave', lastPathRef.current, {
                duration: Math.round(timeSpent / 1000) // seconds
            });
        }

        // Track new page view
        trackEvent('page_view', pathname);

        // Reset timer for new page
        startTimeRef.current = Date.now();
        lastPathRef.current = pathname;

    }, [pathname, user?._id]);

    // Track session end on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            const sessionId = getSessionId();
            const timeSpent = Date.now() - startTimeRef.current;

            // Use sendBeacon for reliable tracking on page close
            if (navigator.sendBeacon) {
                const data = JSON.stringify({
                    type: 'page_leave',
                    page: pathname,
                    sessionId,
                    userId: user?._id || null,
                    metadata: { duration: Math.round(timeSpent / 1000) }
                });
                navigator.sendBeacon('/api/analytics/track', data);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pathname, user?._id]);

    return null; // This component doesn't render anything
}

// Helper function to track events
async function trackEvent(type, page, metadata = {}) {
    try {
        const sessionId = getSessionId();

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                page,
                sessionId,
                metadata
            })
        });
    } catch (error) {
        // Silent fail - don't break the app
        console.debug('Analytics tracking failed:', error);
    }
}
