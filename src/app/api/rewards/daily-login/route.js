/**
 * Daily Login Bonus API Route
 * POST /api/rewards/daily-login
 * 
 * Awards users ETB for logging in daily.
 * Streak system: consecutive day logins get better rewards.
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAccessToken } from '@/lib/auth';

// Reward schedule (in cents)
const REWARD_SCHEDULE = {
    1: 100,   // Day 1-3: 1 ETB
    2: 100,
    3: 100,
    4: 200,   // Day 4-6: 2 ETB
    5: 200,
    6: 200,
    7: 1000,  // Day 7: 10 ETB (week milestone)
    14: 2000, // Day 14: 20 ETB (2-week milestone)
    30: 5000, // Day 30: 50 ETB (month milestone)
};

// Default daily reward for days not in schedule
const DEFAULT_DAILY_REWARD = 100; // 1 ETB

function getRewardForDay(day) {
    if (REWARD_SCHEDULE[day]) {
        return REWARD_SCHEDULE[day];
    }
    // For days between milestones, give default
    if (day <= 3) return 100;
    if (day <= 6) return 200;
    if (day <= 13) return 200; // 2 ETB between week 1 and 2
    if (day <= 29) return 200; // 2 ETB between week 2 and month
    return 200; // 2 ETB for days beyond 30
}

export async function POST(request) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user already claimed today's reward
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (user.lastLoginRewardDate) {
            const lastRewardDate = new Date(user.lastLoginRewardDate);
            const lastRewardDay = new Date(
                lastRewardDate.getFullYear(),
                lastRewardDate.getMonth(),
                lastRewardDate.getDate()
            );

            // If already claimed today
            if (lastRewardDay.getTime() === today.getTime()) {
                return NextResponse.json({
                    alreadyClaimed: true,
                    message: 'You already claimed today\'s reward!',
                    currentStreak: user.loginStreak,
                    nextReward: getRewardForDay(user.loginStreak + 1),
                });
            }

            // Check if streak continued (logged in yesterday)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastRewardDay.getTime() === yesterday.getTime()) {
                // Streak continues!
                user.loginStreak += 1;
            } else {
                // Streak broken, reset to day 1
                user.loginStreak = 1;
            }
        } else {
            // First time claiming
            user.loginStreak = 1;
        }

        // Calculate reward
        const reward = getRewardForDay(user.loginStreak);

        // Award the bonus
        user.balance += reward;
        user.totalLoginRewards += reward;
        user.lastLoginRewardDate = now;

        // Update last login timestamp too
        user.lastLogin = now;

        await user.save();

        // Create transaction record
        await Transaction.create({
            userId: user._id,
            amount: reward,
            type: 'deposit',
            status: 'approved',
            metadata: {
                notes: `Daily Login Bonus - Day ${user.loginStreak}`,
                source: 'daily_login_bonus',
                streak: user.loginStreak,
            }
        });

        return NextResponse.json({
            success: true,
            reward: reward,
            displayReward: (reward / 100).toFixed(2),
            streak: user.loginStreak,
            newBalance: user.balance,
            displayBalance: (user.balance / 100).toFixed(2),
            nextReward: getRewardForDay(user.loginStreak + 1),
            displayNextReward: (getRewardForDay(user.loginStreak + 1) / 100).toFixed(2),
            isMilestone: !!REWARD_SCHEDULE[user.loginStreak],
        });

    } catch (err) {
        console.error('Daily login bonus error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
