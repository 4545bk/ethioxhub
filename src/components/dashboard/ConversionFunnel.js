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
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Conversion Funnel
            </h3>

            <div className="space-y-1">
                {steps.map((step, idx) => (
                    <div key={idx} className="relative">
                        {/* Step Bar */}
                        <div className="flex items-center gap-2">
                            <div className="w-24 flex-shrink-0 text-right">
                                <p className="font-semibold text-gray-900 text-xs">{step.label}</p>
                                <p className="text-[10px] text-gray-500">{step.subtext}</p>
                            </div>

                            <div className="flex-1 h-8 bg-gray-50 rounded-lg relative overflow-hidden flex items-center px-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step.count / visitors) * 100}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.15 }}
                                    className={`absolute top-0 left-0 h-full ${step.color} opacity-20`}
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step.count / visitors) * 100}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.15 }}
                                    className={`absolute left-0 bottom-0 h-1 w-full ${step.color}`}
                                />

                                <div className="relative z-10 flex justify-between w-full">
                                    <span className="font-bold text-gray-800 text-sm">{step.count.toLocaleString()}</span>
                                    {step.rate !== undefined && (
                                        <div className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded text-[10px] font-semibold shadow-sm">
                                            <span>{step.rate.toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connector Arrow */}
                        {idx < steps.length - 1 && (
                            <div className="pl-24 ml-2 py-0.5">
                                <div className="h-2 border-l-2 border-dashed border-gray-300 ml-3"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-gray-500">Visitor to Signup</p>
                    <p className="text-lg font-bold text-purple-600">{visitorToSignup.toFixed(1)}%</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-gray-500">Overall Conversion</p>
                    <p className="text-lg font-bold text-green-600">{overallConversion.toFixed(2)}%</p>
                </div>
            </div>
        </div>
    );
}
