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
    const [selectedAmount, setSelectedAmount] = useState(100); // Default to $100
    const [isCustom, setIsCustom] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
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

    const handlePolarCheckout = async () => {
        const amount = isCustom ? parseFloat(customAmount) : selectedAmount;

        if (!amount || amount < 1) {
            toast.error('Please enter a valid amount');
            return;
        }

        // For preset amounts, use price IDs; for custom amounts, we'll need to create dynamic checkout
        const selectedOption = depositOptions.find(opt => opt.amount === amount);
        const priceId = selectedOption?.priceId;

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/polar/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    priceId,
                    customAmount: isCustom ? Math.round(amount * 100) : null // Send cents for custom amount
                }),
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

    const getETBEquivalent = (usdAmount) => {
        return (usdAmount * 60).toLocaleString();
    };

    const displayAmount = isCustom
        ? (parseFloat(customAmount) || 0)
        : selectedAmount;

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

            {/* Preset Amount Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {depositOptions.map((option) => (
                    <button
                        key={option.amount}
                        onClick={() => {
                            setSelectedAmount(option.amount);
                            setIsCustom(false);
                        }}
                        disabled={loading || !option.priceId}
                        className={`relative p-4 rounded-lg border-2 transition-all ${selectedAmount === option.amount && !isCustom
                                ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50'
                                : 'border-dark-700 hover:border-blue-500/50 bg-dark-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed group`}
                    >
                        {option.popular && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                POPULAR
                            </span>
                        )}

                        {/* Checkmark for selected */}
                        {selectedAmount === option.amount && !isCustom && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                        <div className="text-2xl font-bold text-white mb-1">{option.label}</div>
                        <div className="text-sm text-blue-200">≈ {getETBEquivalent(option.amount)} ETB</div>
                        {!option.priceId && (
                            <div className="mt-2 text-xs text-yellow-400">Coming Soon</div>
                        )}
                    </button>
                ))}
            </div>

            {/* Custom Amount Option */}
            <div className="mb-4">
                <button
                    onClick={() => {
                        setIsCustom(true);
                        setCustomAmount('');
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${isCustom
                            ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/50'
                            : 'border-dark-700 hover:border-purple-500/50 bg-dark-800'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-bold text-white">Custom Amount</div>
                                <div className="text-xs text-purple-300">Enter your own deposit amount</div>
                            </div>
                        </div>

                        {/* Checkmark for selected */}
                        {isCustom && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                </button>

                {/* Custom Amount Input - Show when custom is selected */}
                {isCustom && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-4 bg-dark-800 rounded-lg border border-purple-500/30"
                    >
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                            Enter Amount (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-bold">$</span>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="50.00"
                                min="1"
                                step="0.01"
                                className="w-full pl-8 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                        {customAmount && parseFloat(customAmount) > 0 && (
                            <div className="mt-2 text-sm text-purple-300">
                                ≈ <span className="font-bold">{getETBEquivalent(parseFloat(customAmount))} ETB</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Proceed Button */}
            <button
                onClick={handlePolarCheckout}
                disabled={loading || (isCustom && (!customAmount || parseFloat(customAmount) < 1))}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Redirecting to checkout...</span>
                    </>
                ) : (
                    <>
                        <span>Deposit ${displayAmount.toFixed(2)} USD</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </>
                )}
            </button>

            <div className="flex items-start gap-2 mt-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <strong>Instant:</strong> Funds are added to your wallet immediately after successful payment. Secure payment powered by Stripe.
                </div>
            </div>
        </motion.div>
    );
}
