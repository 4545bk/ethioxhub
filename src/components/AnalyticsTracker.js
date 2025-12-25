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

// Get or create visitor ID (persistent across sessions)
const getVisitorInfo = () => {
    if (typeof window === 'undefined') return { visitorId: null, isNewVisitor: false };

    let visitorId = localStorage.getItem('analytics_visitor_id');
    let isNewVisitor = false;

    if (!visitorId) {
        // First time visitor
        visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_visitor_id', visitorId);
        localStorage.setItem('analytics_first_visit', new Date().toISOString());
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

        // Reset start time for new page
        startTimeRef.current = Date.now();
        lastPathRef.current = pathname;
        let maxScrollDepth = 0;

        // Track page view
        trackEvent('page_view', pathname);

        // Scroll depth tracking
        const updateScrollDepth = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

            if (scrollPercentage > maxScrollDepth && scrollPercentage <= 100) {
                maxScrollDepth = scrollPercentage;
            }
        };

        window.addEventListener('scroll', updateScrollDepth, { passive: true });
        updateScrollDepth(); // Initial check

        // Cleanup: track session end when user leaves
        const handleBeforeUnload = () => {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

            // Track scroll depth achieved
            if (maxScrollDepth > 0) {
                trackEvent('scroll_depth', lastPathRef.current, {
                    depth: maxScrollDepth,
                    duration
                });
            }

            // Use sendBeacon for reliable tracking even when page is closing
            const data = {
                type: 'session_end',
                page: lastPathRef.current,
                sessionId,
                userId: user?.id || null,
                metadata: {
                    duration,
                    scrollDepth: maxScrollDepth
                }
            };

            navigator.sendBeacon?.('/api/analytics/track', JSON.stringify(data));
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('scroll', updateScrollDepth);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [pathname, user]);

    return null; // This component doesn't render anything
}

// Helper function to track events (Exported)
export async function trackAnalyticsEvent(type, page, metadata = {}) {
    try {
        const sessionId = getSessionId();
        const { visitorId, isNewVisitor } = getVisitorInfo();

        if (typeof window === 'undefined') return;

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                page,
                sessionId,
                metadata: {
                    ...metadata,
                    visitorId,
                    isNewVisitor
                }
            })
        });
    } catch (error) {
        // Fail silently - analytics should never break the app
        console.debug('Analytics tracking failed:', error);
    }
}

// Internal alias
const trackEvent = trackAnalyticsEvent;
