'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function WeeklyReport({ report }) {
    if (!report) return null;

    const { growth, thisWeek, lastWeek, summary, bestContent } = report;
    const isGrowing = growth > 0;
    const isStable = Math.abs(growth) < 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 mb-4 text-white shadow-lg"
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold mb-0.5">📊 Weekly Report</h3>
                    <p className="text-xs text-indigo-100">Last 7 days</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1">
                        {isStable ? (
                            <Minus className="w-4 h-4" />
                        ) : isGrowing ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-2xl font-bold">
                            {growth > 0 ? '+' : ''}{growth}%
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-sm font-medium mb-3 leading-relaxed">
                {summary}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-[10px] text-indigo-200 mb-0.5">This Week</p>
                    <p className="text-xl font-bold">{thisWeek.toLocaleString()}</p>
                    <p className="text-[10px] text-indigo-200">views</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-[10px] text-indigo-200 mb-0.5">Last Week</p>
                    <p className="text-xl font-bold">{lastWeek.toLocaleString()}</p>
                    <p className="text-[10px] text-indigo-200">views</p>
                </div>
            </div>

            {bestContent && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <p className="text-[10px] text-indigo-200 mb-0.5">🏆 Best Performing</p>
                    <p className="text-xs font-semibold">{bestContent}</p>
                </div>
            )}
        </motion.div>
    );
}
