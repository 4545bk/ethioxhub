/**
 * PurchaseModal Component
 * Pay-per-view video purchase flow with modern pricing UI
 * Inspired by premium pricing card designs
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurchaseModal({ isOpen, onClose, video, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUserData();
        }
    }, [isOpen]);

    const fetchUserData = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const [meResponse, subResponse] = await Promise.all([
                fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch('/api/subscribe', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ]);

            if (meResponse.ok) {
                const meData = await meResponse.json();
                setUserBalance(meData.user.balance || 0);
            }

            if (subResponse.ok) {
                const subData = await subResponse.json();
                setIsSubscribed(subData.subscription?.active || false);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    const handlePurchase = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Please login to purchase');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/videos/${video._id}/purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to purchase video');
            }

            // Success
            if (onSuccess) {
                onSuccess(data);
            }

            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh to show unlocked video
            }, 1500);

        } catch (err) {
            console.error('Purchase error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (!video) return null;

    const price = video.price || 0;
    const priceETB = (price / 100).toFixed(2);
    const balanceETB = (userBalance / 100).toFixed(2);
    const hasEnoughBalance = userBalance >= price;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative gradient overlay - Enhanced */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg shadow-purple-500/50"></div>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-sm"></div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-10 text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto overflow-x-hidden p-8 pt-10 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                                {/* Video Thumbnail with Overlay */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative mb-6 rounded-2xl overflow-hidden group"
                                >
                                    <div className="aspect-video bg-gray-800 relative">
                                        <img
                                            src={video.thumbnailUrl || '/placeholder-video.png'}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                                        {/* Play icon overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Video title overlay */}
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-white font-bold text-xl line-clamp-2 drop-shadow-lg">
                                                {video.title}
                                            </h3>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Already Subscribed Notice */}
                                {isSubscribed && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-2xl p-5 mb-6 backdrop-blur-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-green-400 font-bold text-lg mb-1">You're a Premium Subscriber! 🎉</p>
                                                <p className="text-green-300 text-sm leading-relaxed">
                                                    You already have unlimited access to this video and all premium content through your subscription.
                                                </p>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onClose}
                                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                        >
                                            Start Watching Now
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* Purchase Section (only if not subscribed) */}
                                {!isSubscribed && (
                                    <>
                                        {/* Header */}
                                        <div className="text-center mb-6">
                                            <div className="inline-block mb-3">
                                                <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
                                                    One-Time Purchase
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">
                                                Purchase Video
                                            </h2>
                                            <p className="text-gray-400">
                                                Get lifetime access to this video
                                            </p>
                                        </div>

                                        {/* Pricing Card */}
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                                            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                                                {/* Price Display */}
                                                <div className="text-center mb-6 pb-6 border-b border-gray-700">
                                                    <div className="flex items-baseline justify-center gap-2 mb-2">
                                                        <span className="text-5xl font-bold text-white">{priceETB}</span>
                                                        <span className="text-2xl font-semibold text-gray-400">ETB</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm">One-time payment • Lifetime access</p>
                                                </div>

                                                {/* What You Get */}
                                                <div className="mb-6">
                                                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">What's Included:</h3>
                                                    <ul className="space-y-3">
                                                        {[
                                                            'Lifetime access to this video',
                                                            'Watch unlimited times',
                                                            'HD quality streaming',
                                                            'No expiration date',
                                                        ].map((item, index) => (
                                                            <motion.li
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.1 * index }}
                                                                className="flex items-start gap-3"
                                                            >
                                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                                                                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                                                            </motion.li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Balance Info */}
                                                <div className="pt-4 border-t border-gray-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 text-sm">Your Balance:</span>
                                                        <span className={`text-xl font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                                                            {balanceETB} ETB
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    {error}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Purchase Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handlePurchase}
                                            disabled={loading || !hasEnoughBalance}
                                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden group ${loading || !hasEnoughBalance
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white'
                                                }`}
                                        >
                                            {!loading && !hasEnoughBalance && (
                                                <span className="relative z-10">Insufficient Balance</span>
                                            )}
                                            {!loading && hasEnoughBalance && (
                                                <>
                                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                                        Purchase for {priceETB} ETB
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                        </svg>
                                                    </span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </>
                                            )}
                                            {loading && (
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            )}
                                        </motion.button>

                                        {!hasEnoughBalance && (
                                            <p className="text-center text-sm text-gray-400 mt-4">
                                                💳 Please deposit funds to your account to purchase
                                            </p>
                                        )}

                                        {/* Or Subscribe Section */}
                                        <div className="mt-8 pt-6 border-t border-gray-700">
                                            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-xl p-5">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-yellow-400 font-bold text-sm mb-1">Better Value!</p>
                                                        <p className="text-gray-300 text-sm leading-relaxed">
                                                            Get unlimited access to all videos for just <span className="font-bold text-white">1000 ETB/month</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        onClose();
                                                        window.location.href = '/pricing';
                                                    }}
                                                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                                                >
                                                    View Premium Plans
                                                </button>
                                            </div>
                                        </div>

                                        {/* Security Badge */}
                                        <div className="mt-6 text-center">
                                            <div className="inline-flex items-center gap-2 text-gray-400 text-xs">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                <span>Secure payment • Instant access</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
