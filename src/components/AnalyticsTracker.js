'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

// Generate or retrieve session ID (per browser session)
const getSessionId = () => {
    if (typeof window === 'undefined') return null;

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

// Get or create persistent visitor ID (for new vs returning tracking)
const getVisitorInfo = () => {
    if (typeof window === 'undefined') return { visitorId: null, isNewVisitor: false };

    const VISITOR_KEY = 'ethioxhub_visitor_id';
    const FIRST_VISIT_KEY = 'ethioxhub_first_visit';

    let visitorId = localStorage.getItem(VISITOR_KEY);
    let isNewVisitor = false;

    if (!visitorId) {
        // First time visitor
        visitorId = `v_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(VISITOR_KEY, visitorId);
        localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
        isNewVisitor = true;
    }

    return { visitorId, isNewVisitor };
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
        const { visitorId, isNewVisitor } = getVisitorInfo();

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                page,
                sessionId,
                visitorId,
                isNewVisitor,
                metadata
            })
        });
    } catch (error) {
        // Silent fail - don't break the app
        console.debug('Analytics tracking failed:', error);
    }
}
