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
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-xl"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold mb-1">📊 Weekly Growth Report</h3>
                    <p className="text-sm text-indigo-100">Last 7 days performance</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2">
                        {isStable ? (
                            <Minus className="w-6 h-6" />
                        ) : isGrowing ? (
                            <TrendingUp className="w-6 h-6" />
                        ) : (
                            <TrendingDown className="w-6 h-6" />
                        )}
                        <span className="text-3xl font-bold">
                            {growth > 0 ? '+' : ''}{growth}%
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-lg font-medium mb-4 leading-relaxed">
                {summary}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-indigo-200 mb-1">This Week</p>
                    <p className="text-2xl font-bold">{thisWeek.toLocaleString()}</p>
                    <p className="text-xs text-indigo-200">views</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-indigo-200 mb-1">Last Week</p>
                    <p className="text-2xl font-bold">{lastWeek.toLocaleString()}</p>
                    <p className="text-xs text-indigo-200">views</p>
                </div>
            </div>

            {bestContent && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-xs text-indigo-200 mb-1">🏆 Best Performing</p>
                    <p className="text-sm font-semibold">{bestContent}</p>
                </div>
            )}
        </motion.div>
    );
}
