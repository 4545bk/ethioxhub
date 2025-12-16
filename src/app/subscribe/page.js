'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SubscribePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        checkSubscriptionStatus();
    }, [user, authLoading]);

    const checkSubscriptionStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/subscribe', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.subscription);
            }
        } catch (e) {
            console.error('Failed to check subscription:', e);
        } finally {
            setCheckingStatus(false);
        }
    };

    const triggerCelebration = () => {
        // Confetti animation
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const handleSubscribe = async () => {
        if (!user) return router.push('/login');
        if (loading) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                triggerCelebration();
                toast.success('🎉 Welcome to VIP! You now have unlimited access!');

                // Refresh subscription status
                await checkSubscriptionStatus();

                // Redirect after celebration
                setTimeout(() => router.push('/'), 3000);
            } else {
                toast.error(data.error || 'Subscription failed');
                if (data.error && data.error.includes('balance')) {
                    setTimeout(() => router.push('/deposit'), 2000);
                }
            }
        } catch (e) {
            toast.error('Subscription failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || checkingStatus) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) return null;

    const isActive = subscription?.active;

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <div className="pt-32 px-4 flex justify-center">
                <div className="card max-w-md w-full text-center p-8 bg-gradient-to-br from-dark-900 to-dark-800 border border-primary-500/30 shadow-2xl shadow-primary-500/10">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl rotate-3 mb-6 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>

                    {isActive ? (
                        <>
                            <div className="mb-4">
                                <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full text-sm shadow-lg">
                                    ⭐ VIP MEMBER
                                </span>
                            </div>
                            <h1 className="text-3xl font-display font-bold text-white mb-2">You're Premium!</h1>
                            <p className="text-green-400 font-medium mb-6">Enjoy unlimited access to all content</p>

                            <div className="bg-dark-800/50 rounded-lg p-4 mb-6">
                                <p className="text-dark-300 text-sm mb-2">Subscription expires on:</p>
                                <p className="text-white font-bold text-lg">
                                    {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/')}
                                className="btn btn-secondary w-full py-4 text-lg"
                            >
                                Browse Content
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-display font-bold text-white mb-2">EthioxHub VIP</h1>
                            <p className="text-primary-300 font-medium text-lg mb-6">Unlock All Content</p>

                            <div className="space-y-4 mb-8 text-left max-w-xs mx-auto text-dark-300">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Access to ALL premium videos</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Ad-free experience</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Support creators directly</span>
                                </div>
                            </div>

                            <div className="text-4xl font-bold text-white mb-8">
                                1000 ETB
                                <span className="text-base font-normal text-dark-400"> / month</span>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="btn btn-primary w-full py-4 text-lg shadow-lg shadow-primary-600/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Upgrade Now'}
                            </button>

                            <p className="mt-4 text-xs text-dark-500">
                                Secure payment via your wallet balance. Cancel anytime.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
