'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdBanner({ zoneId, width, height, className = '' }) {
    const { user } = useAuth();
    const adRef = useRef(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        // Don't show ads if user is premium/VIP
        if (user?.subscriptionStatus === 'active' || user?.role === 'admin') {
            return;
        }

        // Only load if not already loaded (to prevent duplicates)
        if (adRef.current && !adRef.current.innerHTML) {
            // Create the ins element programmatically to ensure it renders fresh
            const ins = document.createElement('ins');
            ins.id = zoneId;
            ins.setAttribute('data-width', width);
            ins.setAttribute('data-height', height);
            ins.style.display = 'inline-block';
            ins.style.width = `${width}px`;
            ins.style.height = `${height}px`;

            adRef.current.appendChild(ins);

            // Load the script
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.dataset.cfasync = 'false';
            script.src = 'https://poweredby.jads.co/js/jads.js';

            // Push to queue
            const queueScript = document.createElement('script');
            queueScript.type = 'text/javascript';
            queueScript.dataset.cfasync = 'false';
            queueScript.text = `(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':${zoneId}});`;

            adRef.current.appendChild(script);
            adRef.current.appendChild(queueScript);

            scriptLoadedRef.current = true;
        }
    }, [user, zoneId, width, height]);

    // If premium, render nothing
    if (user?.subscriptionStatus === 'active' || user?.role === 'admin') {
        return null;
    }

    return (
        <div className={`flex justify-center items-center my-4 overflow-hidden ${className}`}>
            <div ref={adRef}></div>
            {/* Fallback label */}
            <div className="absolute text-[10px] text-gray-600 mt-2 -mb-4 opacity-50">Advertisement</div>
        </div>
    );
}
