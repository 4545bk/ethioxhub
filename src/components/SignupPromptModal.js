'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { setSignupModalListener } from '@/utils/signupModalTrigger';

export default function SignupPromptModal() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    // Register this modal with the global trigger system
    useEffect(() => {
        setSignupModalListener(() => {
            if (!user) {
                setIsOpen(true);
            }
        });
    }, [user]);

    useEffect(() => {
        // Don't show if user is logged in
        if (user) return;

        const showPopup = () => {
            const lastShown = localStorage.getItem('signupPopupLastShown');
            const now = Date.now();
            const oneMinute = 1 * 60 * 1000; // 1 minute in milliseconds

            // Show if never shown OR if 1 minute has passed since last shown
            const shouldShow = !lastShown || (now - parseInt(lastShown) > oneMinute);

            if (shouldShow) {
                setIsOpen(true);
                localStorage.setItem('signupPopupLastShown', now.toString());
            }
        };

        // Show after 10 seconds initially
        const initialTimer = setTimeout(showPopup, 10000);

        // Then show every 1 minute if user hasn't signed up
        const recurringInterval = setInterval(() => {
            if (!user) {
                showPopup();
            }
        }, 1 * 60 * 1000); // Every 1 minute!

        return () => {
            clearTimeout(initialTimer);
            clearInterval(recurringInterval);
        };
    }, [user]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSignup = () => {
        setIsOpen(false);
        router.push('/register');
    };

    const handleLogin = () => {
        setIsOpen(false);
        router.push('/login');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center"
                    />

                    {/* Modal - Centered */}
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="w-full max-w-md pointer-events-auto"
                        >
                            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-orange-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 animate-pulse" />

                                {/* Close button */}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className="flex justify-center mb-4">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center"
                                        >
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </motion.div>
                                    </div>

                                    {/* Title - Bilingual */}
                                    <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                        Unlock Premium Content! 🔥
                                    </h2>
                                    <p className="text-lg font-semibold text-center mb-1 text-orange-300">
                                        ልዩ ይዘቶችን ይክፈቱ!
                                    </p>

                                    <p className="text-gray-300 text-center mb-6 text-sm">
                                        Join thousands enjoying exclusive content<br />
                                        <span className="text-gray-400">(በሺዎች የሚቆጠሩ ተጠቃሚዎች ይቀላቀሉ)</span>
                                    </p>

                                    {/* Benefits - Bilingual */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                <Gift className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <span className="text-gray-200">Get <strong className="text-orange-400">100 ETB FREE</strong> on signup</span>
                                                <p className="text-xs text-gray-500">(በምዝገባ 100 ብር በነጻ ያግኙ)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                <Zap className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <span className="text-gray-200">Access <strong className="text-orange-400">exclusive videos & photos</strong></span>
                                                <p className="text-xs text-gray-500">(ልዩ ቪዲዮዎችን እና ፎቶዎችን ያግኙ)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <span className="text-gray-200"><strong className="text-orange-400">Ad-free</strong> experience</span>
                                                <p className="text-xs text-gray-500">(ማስታወቂያ የለሽ ተሞክሮ)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleSignup}
                                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
                                        >
                                            Sign Up Free - Get 100 ETB 🎁
                                        </button>
                                        <p className="text-xs text-center text-gray-500">(በነጻ ይመዝገቡ - 100 ብር ያግኙ)</p>

                                        <button
                                            onClick={handleLogin}
                                            className="w-full py-3.5 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all border border-gray-600"
                                        >
                                            Already have an account? Login
                                        </button>
                                        <p className="text-xs text-center text-gray-500">(መለያ አለዎት? ይግቡ)</p>
                                    </div>

                                    {/* Footer */}
                                    <p className="text-xs text-gray-500 text-center mt-4">
                                        No credit card required • Cancel anytime
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
