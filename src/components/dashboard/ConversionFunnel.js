'use client';

import { motion } from 'framer-motion';

export default function ConversionFunnel({ funnel }) {
    if (!funnel) return null;

    const { visitors, signups, purchaseStarts, purchases } = funnel;

    // Calculate conversion rates
    const visitorToSignup = visitors > 0 ? (signups / visitors) * 100 : 0;
    const signupToPurchaseStart = signups > 0 ? (purchaseStarts / signups) * 100 : 0;
    const purchaseStartToFinish = purchaseStarts > 0 ? (purchases / purchaseStarts) * 100 : 0;
    const overallConversion = visitors > 0 ? (purchases / visitors) * 100 : 0;

    const steps = [
        { label: 'Site Visits', count: visitors, color: 'bg-blue-500', subtext: 'Total Traffic' },
        { label: 'Signups', count: signups, color: 'bg-purple-500', rate: visitorToSignup, subtext: 'Registered Users' },
        { label: 'Checkout', count: purchaseStarts, color: 'bg-orange-500', rate: signupToPurchaseStart, subtext: 'Initiated Purchase' },
        { label: 'Sales', count: purchases, color: 'bg-green-500', rate: purchaseStartToFinish, subtext: 'Completed Payment' },
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Conversion Funnel
            </h3>

            <div className="space-y-2">
                {steps.map((step, idx) => (
                    <div key={idx} className="relative">
                        {/* Step Bar */}
                        <div className="flex items-center gap-4">
                            <div className="w-32 flex-shrink-0 text-right">
                                <p className="font-semibold text-gray-900">{step.label}</p>
                                <p className="text-xs text-gray-500">{step.subtext}</p>
                            </div>

                            <div className="flex-1 h-12 bg-gray-50 rounded-lg relative overflow-hidden flex items-center px-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step.count / visitors) * 100}%` }}
                                    transition={{ duration: 1, delay: idx * 0.2 }}
                                    className={`absolute top-0 left-0 h-full ${step.color} opacity-20`}
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step.count / visitors) * 100}%` }}
                                    transition={{ duration: 1, delay: idx * 0.2 }}
                                    className={`absolute left-0 bottom-0 h-1 w-full ${step.color}`}
                                />

                                <div className="relative z-10 flex justify-between w-full">
                                    <span className="font-bold text-gray-800 text-lg">{step.count.toLocaleString()}</span>
                                    {step.rate !== undefined && (
                                        <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded text-xs font-semibold shadow-sm">
                                            <span>{step.rate.toFixed(1)}%</span>
                                            <span className="text-gray-400">conv.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connector Arrow */}
                        {idx < steps.length - 1 && (
                            <div className="pl-32 ml-4 py-1">
                                <div className="h-4 border-l-2 border-dashed border-gray-300 ml-6"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Visitor to Signup</p>
                    <p className="text-2xl font-bold text-purple-600">{visitorToSignup.toFixed(1)}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Overall Conversion</p>
                    <p className="text-2xl font-bold text-green-600">{overallConversion.toFixed(2)}%</p>
                </div>
            </div>
        </div>
    );
}
