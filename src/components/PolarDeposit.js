/**
 * Polar Deposit Component
 * PURPOSE: Allows users to deposit funds via international card payments
 * INTEGRATION: Additive component - existing bank deposit flow remains unchanged
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';

export default function PolarDeposit() {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const depositOptions = [
        {
            amount: 50,
            priceId: process.env.NEXT_PUBLIC_POLAR_PRICE_ID_50,
            label: '$50 USD',
            popular: false,
        },
        {
            amount: 100,
            priceId: process.env.NEXT_PUBLIC_POLAR_PRICE_ID_100,
            label: '$100 USD',
            popular: true,
        },
        {
            amount: 200,
            priceId: process.env.NEXT_PUBLIC_POLAR_PRICE_ID_200,
            label: '$200 USD',
            popular: false,
        },
    ];

    const handlePolarCheckout = async (priceId) => {
        if (!priceId) {
            toast.error('Invalid deposit option');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/polar/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ priceId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create checkout');
            }

            const data = await response.json();

            // Redirect to Polar checkout
            window.location.href = data.checkoutUrl;
        } catch (error) {
            console.error('Polar checkout error:', error);
            toast.error(error.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20"
        >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-500/20">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">International Payment</h3>
                    <p className="text-xs text-blue-300">Pay with credit/debit card via Stripe</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {depositOptions.map((option) => (
                    <button
                        key={option.amount}
                        onClick={() => handlePolarCheckout(option.priceId)}
                        disabled={loading || !option.priceId}
                        className={`relative p-4 rounded-lg border-2 transition-all ${option.popular
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-dark-700 hover:border-blue-500/50 bg-dark-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed group`}
                    >
                        {option.popular && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                POPULAR
                            </span>
                        )}
                        <div className="text-2xl font-bold text-white mb-1">{option.label}</div>
                        <div className="text-xs text-dark-400">~{option.amount * 60} ETB</div>
                        {!option.priceId && (
                            <div className="mt-2 text-xs text-yellow-400">Coming Soon</div>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <strong>Instant:</strong> Funds are added to your wallet immediately after successful payment. Secure payment powered by Stripe.
                </div>
            </div>

            {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                    <span className="text-sm">Redirecting to checkout...</span>
                </div>
            )}
        </motion.div>
    );
}
