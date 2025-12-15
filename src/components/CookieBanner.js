'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);

    // Cookie preferences state
    const [preferences, setPreferences] = useState({
        necessary: true, // Always true
        analytics: true,
        marketing: true,
    });

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Delay showing slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        }));
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            ...preferences,
            timestamp: new Date().toISOString()
        }));
        setShowCustomize(false);
        setIsVisible(false);
    };

    const togglePreference = (key) => {
        if (key === 'necessary') return;
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 shadow-2xl"
                    >
                        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
                            <p className="text-gray-300 text-sm mb-4 max-w-2xl">
                                Some features may not be available with your selection. For a better browsing experience, you may select "Accept All Cookies."
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCustomize(true)}
                                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white hover:border-gray-500 font-medium text-sm transition-all"
                                >
                                    Customize
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-900/20 transition-all hover:scale-105"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customize Modal */}
            <AnimatePresence>
                {showCustomize && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">Cookie Preferences</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    Manage your cookie settings. Necessary cookies are required for the website to function.
                                </p>

                                <div className="space-y-4">
                                    {/* Necessary */}
                                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                        <div>
                                            <p className="font-medium text-white text-sm">Necessary</p>
                                            <p className="text-xs text-gray-500">Core functionality</p>
                                        </div>
                                        <div className="w-10 h-5 bg-orange-600/50 rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                                            <div className="w-3 h-3 bg-white rounded-full" />
                                        </div>
                                    </div>

                                    {/* Analytics */}
                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-colors"
                                        onClick={() => togglePreference('analytics')}
                                    >
                                        <div>
                                            <p className="font-medium text-white text-sm">Analytics</p>
                                            <p className="text-xs text-gray-500">Usage stats & improvements</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${preferences.analytics ? 'bg-orange-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                                            <motion.div layout className="w-3 h-3 bg-white rounded-full" />
                                        </div>
                                    </div>

                                    {/* Marketing */}
                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-colors"
                                        onClick={() => togglePreference('marketing')}
                                    >
                                        <div>
                                            <p className="font-medium text-white text-sm">Marketing</p>
                                            <p className="text-xs text-gray-500">Tailored recommendations</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${preferences.marketing ? 'bg-orange-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                                            <motion.div layout className="w-3 h-3 bg-white rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-4 border-t border-gray-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCustomize(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePreferences}
                                    className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
