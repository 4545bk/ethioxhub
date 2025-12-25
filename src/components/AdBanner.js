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
        <div className={`flex flex-col items-center my-6 overflow-hidden ${className}`}>
            <div className="relative">
                {/* Ad Label */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 bg-black/80 px-2 py-0.5 rounded-full z-10 border border-gray-800">
                    Advertisement
                </div>

                {/* Ad Container */}
                <div ref={adRef} className="bg-gray-900/50 rounded-lg"></div>
            </div>

            {/* Upsell Button */}
            <a
                href="/register"
                className="mt-2 text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors group bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 hover:bg-orange-500/20"
            >
                <span>🚫 Remove Ads</span>
                <span className="text-gray-500 group-hover:text-gray-400">•</span>
                <span className="text-green-400">Go Premium 💎</span>
            </a>
        </div>
    );
}
