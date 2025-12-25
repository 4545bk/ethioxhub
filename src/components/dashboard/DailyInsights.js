'use client';

import { motion } from 'framer-motion';

export default function DailyInsights({ insights }) {
    if (!insights) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
            {/* Positives */}
            <motion.div variants={item} className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                        <span className="text-base">👍</span>
                    </div>
                    <h3 className="text-sm font-bold text-green-100">Doing Great</h3>
                </div>
                <ul className="space-y-2">
                    {insights.positives.map((text, i) => (
                        <li key={i} className="flex items-start gap-2 text-green-200/90 text-xs">
                            <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{text}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Improvements */}
            <motion.div variants={item} className="bg-gradient-to-br from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                        <span className="text-base">👎</span>
                    </div>
                    <h3 className="text-sm font-bold text-red-100">Needs Focus</h3>
                </div>
                <ul className="space-y-2">
                    {insights.negatives.map((text, i) => (
                        <li key={i} className="flex items-start gap-2 text-red-200/90 text-xs">
                            <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{text}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Action Plan */}
            <motion.div variants={item} className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group text-white">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13 2a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zm-3 8a3 3 0 100-6 3 3 0 000 6zm6 4v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 012-2h8a2 2 0 002 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                        <span className="text-base">🚀</span>
                    </div>
                    <h3 className="text-sm font-bold text-blue-100">Growth Plan</h3>
                </div>
                <div className="space-y-2">
                    {insights.actions.map((text, i) => (
                        <div key={i} className="flex items-start gap-2 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-[10px] flex items-center justify-center font-bold">
                                {i + 1}
                            </span>
                            <span className="text-xs font-medium">{text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
