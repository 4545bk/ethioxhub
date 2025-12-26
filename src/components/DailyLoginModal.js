'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DailyLoginModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [reward, setReward] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alreadyClaimed, setAlreadyClaimed] = useState(false);

    useEffect(() => {
        // Only check for logged-in users
        if (user) {
            checkAndClaimDailyBonus();
        }
    }, [user]);

    const checkAndClaimDailyBonus = async () => {
        if (!user || loading) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch('/api/rewards/daily-login', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.success) {
                setReward(data);
                setIsOpen(true);
            } else if (data.alreadyClaimed) {
                setAlreadyClaimed(true);
                // Don't show modal if already claimed
            }
        } catch (err) {
            console.error('Daily bonus error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !reward) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full p-8 border border-orange-500/20 shadow-2xl animate-scaleIn">
                {/* Header */}
                <div className="text-center mb-6">
                    {/* Streak Badge */}
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20 mb-4">
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-orange-400 font-bold">Day {reward.streak}</span>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {reward.isMilestone ? '🎉 Milestone Reward!' : '🎁 Daily Bonus'}
                    </h2>
                    <p className="text-gray-400">
                        {reward.isMilestone
                            ? `Congratulations on reaching Day ${reward.streak}!`
                            : 'Thank you for coming back!'}
                    </p>
                </div>

                {/* Reward Amount */}
                <div className="bg-orange-500/10 rounded-xl p-6 border border-orange-500/20 mb-6">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">You earned</p>
                        <p className="text-5xl font-bold text-orange-500 mb-2">
                            {reward.displayReward} ETB
                        </p>
                        <p className="text-gray-400 text-sm">
                            New balance: {reward.displayBalance} ETB
                        </p>
                    </div>
                </div>

                {/* Streak Progress */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Login Streak</span>
                        <span className="text-sm text-orange-400 font-bold">{reward.streak} days 🔥</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                            style={{ width: `${Math.min((reward.streak / 30) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                        Come back tomorrow for {reward.displayNextReward} ETB!
                    </p>
                </div>

                {/* Milestones */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-400 mb-3 text-center font-semibold">Upcoming Milestones</p>
                    <div className="space-y-2">
                        {reward.streak < 7 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">⭐ Day 7</span>
                                <span className="text-orange-400 font-bold">10 ETB</span>
                            </div>
                        )}
                        {reward.streak < 14 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">⭐⭐ Day 14</span>
                                <span className="text-orange-400 font-bold">20 ETB</span>
                            </div>
                        )}
                        {reward.streak < 30 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">🏆 Day 30</span>
                                <span className="text-orange-400 font-bold">50 ETB</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                >
                    Awesome! 🚀
                </button>
            </div>
        </div>
    );
}
