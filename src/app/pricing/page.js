'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState('1-month');
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchUserBalance();
    }, []);

    const fetchUserBalance = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setUserBalance(data.user.balance || 0);
            }
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    };

    const plans = [
        {
            id: '1-month',
            name: 'Monthly',
            duration: '1 Month',
            price: 1000,
            priceInCents: 100000,
            description: 'Perfect for trying out',
            popular: false,
            features: [
                'Unlimited access to all premium videos',
                'HD quality streaming',
                'Ad-free viewing',
                'Early access to new releases',
                'Cancel anytime',
                '30-day access period',
            ],
            gradient: 'from-blue-600 to-cyan-600',
            badge: 'Starter',
            badgeColor: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
        },
        {
            id: '2-month',
            name: 'Bi-Monthly',
            duration: '2 Months',
            price: 1800,
            priceInCents: 180000,
            description: 'Best value for money',
            popular: true,
            savings: '10% OFF',
            features: [
                'Everything in Monthly plan',
                'Save 200 ETB (10% discount)',
                '60-day continuous access',
                'Priority customer support',
                'Exclusive content previews',
                'No price increase for 2 months',
            ],
            gradient: 'from-yellow-600 to-orange-600',
            badge: 'Most Popular',
            badgeColor: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/50',
        },
        {
            id: '3-month',
            name: 'Quarterly',
            duration: '3 Months',
            price: 2550,
            priceInCents: 255000,
            description: 'For the dedicated viewer',
            popular: false,
            savings: '15% OFF',
            features: [
                'Everything in Bi-Monthly plan',
                'Save 450 ETB (15% discount)',
                '90-day continuous access',
                'VIP customer support',
                'Exclusive behind-the-scenes content',
                'First access to premium features',
            ],
            gradient: 'from-purple-600 to-pink-600',
            badge: 'Best Value',
            badgeColor: 'from-purple-500/20 to-pink-500/20',
            borderColor: 'border-purple-500/30',
        },
    ];

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const hasEnoughBalance = userBalance >= (selectedPlanData?.priceInCents || 0);

    const handleSubscribe = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Please login to subscribe');
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // For now, use the existing subscribe endpoint (1 month)
            // In production, you'd update the API to accept duration
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    duration: selectedPlanData.id,
                    amount: selectedPlanData.priceInCents,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to subscribe');
            }

            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (err) {
            console.error('Subscribe error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <Navbar />

            <div className="pt-24 pb-16">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-bold uppercase tracking-wider mb-6">
                            Premium Plans
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Choose Your <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Premium</span> Plan
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-4">
                            Unlock unlimited access to all premium videos. Cancel anytime.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Your Balance: <span className="font-bold text-white">{(userBalance / 100).toFixed(2)} ETB</span></span>
                        </div>
                    </motion.div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative"
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-5 left-0 right-0 flex justify-center z-10">
                                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-yellow-500/50">
                                            ⭐ {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border-2 transition-all duration-300 cursor-pointer ${selectedPlan === plan.id
                                        ? `${plan.borderColor} shadow-2xl scale-105`
                                        : 'border-gray-700 hover:border-gray-600 hover:scale-102'
                                        } ${plan.popular ? 'md:-mt-4 md:pb-12' : ''}`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {/* Top Gradient Line */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.gradient} rounded-t-3xl`}></div>

                                    {/* Badge */}
                                    <div className="mb-6">
                                        <span className={`inline-block px-4 py-1.5 bg-gradient-to-r ${plan.badgeColor} border ${plan.borderColor} rounded-full text-sm font-bold uppercase tracking-wider`}>
                                            {plan.badge}
                                        </span>
                                    </div>

                                    {/* Plan Name */}
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-400 mb-6">{plan.description}</p>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-bold text-white">{plan.price}</span>
                                            <span className="text-2xl text-gray-400">ETB</span>
                                        </div>
                                        <p className="text-sm text-gray-400">{plan.duration} • {(plan.price / (plan.id === '1-month' ? 1 : plan.id === '2-month' ? 2 : 3)).toFixed(0)} ETB/month</p>
                                        {plan.savings && (
                                            <span className="inline-block mt-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold">
                                                💰 {plan.savings}
                                            </span>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * i }}
                                                className="flex items-start gap-3"
                                            >
                                                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                                            </motion.li>
                                        ))}
                                    </ul>

                                    {/* Select Button */}
                                    <button
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedPlan === plan.id
                                            ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg`
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                    >
                                        {selectedPlan === plan.id ? '✓ Selected' : 'Select Plan'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Checkout Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Complete Your Subscription</h2>

                            {/* Selected Plan Summary */}
                            <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedPlanData?.name} Plan</h3>
                                        <p className="text-sm text-gray-400">{selectedPlanData?.duration}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-white">{selectedPlanData?.price} ETB</p>
                                        {selectedPlanData?.savings && (
                                            <p className="text-sm text-green-400">{selectedPlanData.savings}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Your Balance:</span>
                                        <span className={`text-xl font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                                            {(userBalance / 100).toFixed(2)} ETB
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl mb-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Subscription successful! Redirecting...
                                    </div>
                                </div>
                            )}

                            {/* Subscribe Button */}
                            <button
                                onClick={handleSubscribe}
                                disabled={loading || !hasEnoughBalance || success}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-4 ${loading || !hasEnoughBalance || success
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : `bg-gradient-to-r ${selectedPlanData?.gradient} text-white shadow-lg hover:shadow-2xl`
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : success ? (
                                    '✓ Subscription Complete!'
                                ) : !hasEnoughBalance ? (
                                    'Insufficient Balance'
                                ) : (
                                    `Subscribe for ${selectedPlanData?.price} ETB`
                                )}
                            </button>

                            {!hasEnoughBalance && (
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mb-3">
                                        💳 Need more funds? Deposit to your account first
                                    </p>
                                    <Link
                                        href="/deposit"
                                        className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        Go to Deposit
                                    </Link>
                                </div>
                            )}

                            {/* Trust Badge */}
                            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                                <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Secure Payment
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Instant Access
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Cancel Anytime
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
