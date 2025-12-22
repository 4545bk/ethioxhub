/**
 * Admin Analytics API
 * Fetch key metrics for the admin dashboard
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Video from '@/models/Video';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        if (!user || !user.roles.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        // 1. Total Users & New Users & Active Users
        const totalUsers = await User.countDocuments({});

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

        // 2. Total Views
        const viewsAgg = await Video.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

        // 3. Total Revenue (Confirmed Deposits) - Breakdown by method
        const revenueAgg = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'approved' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // Revenue from International Card Payments (Polar)
        const polarRevenueAgg = await Transaction.aggregate([
            {
                $match: {
                    type: 'deposit',
                    status: 'approved',
                    $or: [
                        { 'metadata.source': 'polar' },
                        { 'metadata.notes': { $regex: 'Polar|International card payment', $options: 'i' } }
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const polarRevenue = polarRevenueAgg.length > 0 ? polarRevenueAgg[0].total : 0;

        // Revenue from Bank Transfers (exclude Polar)
        const bankRevenue = totalRevenue - polarRevenue;

        // 4. Counts
        const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
        const pendingVideos = await Video.countDocuments({ status: 'pending_moderation' });
        const totalVideos = await Video.countDocuments({});

        // Debug logging for server console
        console.log('Analytics fetched:', { totalUsers, activeUsers, totalVideos, totalRevenue, polarRevenue, bankRevenue, pendingVideos });

        return NextResponse.json({
            success: true,
            analytics: {
                totalUsers,
                newUsers,
                activeUsers,
                totalViews,
                totalRevenue,
                polarRevenue, // International card payments
                bankRevenue, // Bank transfers
                pendingDeposits,
                pendingVideos,
                totalVideos
            }
        });

    } catch (err) {
        console.error('Analytics API Error:', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
