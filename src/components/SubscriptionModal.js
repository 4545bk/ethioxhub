/**
 * SubscriptionModal Component
 * 1000 Birr/month subscription flow with modern pricing UI
 * Inspired by premium pricing card designs
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscriptionModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [subscription, setSubscription] = useState(null);

    const SUBSCRIPTION_PRICE = 100000; // 1000 ETB in cents
    const SUBSCRIPTION_PRICE_ETB = 1000;

    useEffect(() => {
        if (isOpen) {
            fetchUserData();
            fetchSubscription();
        }
    }, [isOpen]);

    const fetchUserData = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserBalance(data.user.balance || 0);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    const fetchSubscription = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch('/api/subscribe', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSubscription(data.subscription);
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
        }
    };

    const handleSubscribe = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Please login to subscribe');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to subscribe');
            }

            // Success
            if (onSuccess) {
                onSuccess(data);
            }

            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh to update subscription status
            }, 2000);

        } catch (err) {
            console.error('Subscribe error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isSubscribed = subscription?.active;
    const hasEnoughBalance = userBalance >= SUBSCRIPTION_PRICE;

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
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 shadow-lg shadow-orange-500/50"></div>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 blur-sm"></div>

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
                                {/* Header */}
                                <div className="text-center mb-8">
                                    {/* Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg mb-6"
                                    >
                                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </motion.div>

                                    {/* Badge */}
                                    <div className="inline-block">
                                        <span className="px-4 py-1.5 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-bold uppercase tracking-wider">
                                            Premium Plan
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-4xl font-bold text-white mt-4 mb-2">
                                        {isSubscribed ? 'Active Subscription' : 'Go Premium'}
                                    </h2>
                                    <p className="text-gray-400 text-lg">
                                        {isSubscribed
                                            ? 'Enjoy unlimited access to all content'
                                            : 'Unlock unlimited access to premium videos'}
                                    </p>
                                </div>

                                {/* Current Subscription Status */}
                                {isSubscribed && subscription.expiresAt && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-2xl p-5 mb-6 backdrop-blur-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-green-400 font-semibold text-sm">Active Subscription</p>
                                                <p className="text-white font-bold text-lg">
                                                    Valid until {formatDate(subscription.expiresAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Pricing Card */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl blur-xl"></div>
                                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                                        <div className="text-center mb-6">
                                            <div className="flex items-baseline justify-center gap-2">
                                                <span className="text-5xl font-bold text-white">{SUBSCRIPTION_PRICE_ETB}</span>
                                                <span className="text-2xl font-semibold text-gray-400">ETB</span>
                                            </div>
                                            <p className="text-gray-400 mt-2">per month</p>
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-3 mb-6">
                                            {[
                                                'Unlimited access to all premium videos',
                                                'No per-video purchase needed',
                                                'Early access to new releases',
                                                'Ad-free viewing experience',
                                                'HD quality streaming',
                                                '30-day access period',
                                            ].map((benefit, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * index }}
                                                    className="flex items-start gap-3"
                                                >
                                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                                                        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-300 text-sm leading-relaxed">{benefit}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Balance Info */}
                                        <div className="pt-4 border-t border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Your Balance:</span>
                                                <span className={`text-xl font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                                                    {(userBalance / 100).toFixed(2)} ETB
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

                                {/* Action Button */}
                                {!isSubscribed && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubscribe}
                                        disabled={loading || !hasEnoughBalance}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden group ${loading || !hasEnoughBalance
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:shadow-2xl hover:shadow-orange-500/50 text-white'
                                            }`}
                                    >
                                        {!loading && !hasEnoughBalance && (
                                            <span className="relative z-10">Insufficient Balance</span>
                                        )}
                                        {!loading && hasEnoughBalance && (
                                            <>
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    Subscribe Now
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                                )}

                                {!hasEnoughBalance && !isSubscribed && (
                                    <p className="text-center text-sm text-gray-400 mt-4">
                                        💳 Please deposit funds to your account to subscribe
                                    </p>
                                )}

                                {/* Guarantee Badge */}
                                {!isSubscribed && (
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-gray-400 text-xs">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Secure payment • Cancel anytime</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
