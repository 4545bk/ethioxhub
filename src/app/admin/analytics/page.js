'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

// Helper to format seconds into readable duration
const formatDuration = (seconds) => {
    if (!seconds || seconds < 1) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
};

// Helper to get country flag emoji from country code
const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode === 'Unknown') return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    try {
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌍';
    }
};

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState(7); // days

    useEffect(() => {
        if (authLoading) return;

        if (!user || !user.roles?.includes('admin')) {
            router.push('/');
            return;
        }

        fetchAnalytics();
    }, [user, authLoading, period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/analytics/traffic?days=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Website Analytics</h1>
                            <p className="text-sm text-gray-500">Track visitor behavior and traffic patterns</p>
                        </div>

                        {/* Period Selector */}
                        <select
                            value={period}
                            onChange={(e) => setPeriod(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                        >
                            <option value={1}>Last 24 hours</option>
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Page Views */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase">Total Views</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {stats?.totalPageViews?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Unique Visitors */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase">Unique Visitors</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {stats?.uniqueVisitors?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Avg Session Duration */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase">Avg Session</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {stats?.avgSessionDuration ? formatDuration(stats.avgSessionDuration) : '0s'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Time on site</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Pages Per Session */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase">Pages/Session</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {stats?.avgPagesPerSession || '0'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Engagement</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Traffic Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Traffic Over Time</h2>
                            <div className="h-64 flex items-end space-x-2">
                                {stats?.pageViewsByDay?.map((day, index) => {
                                    const maxViews = Math.max(...stats.pageViewsByDay.map(d => d.count));
                                    const height = (day.count / maxViews) * 100;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center">
                                            <div
                                                className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all hover:from-orange-700 hover:to-orange-500 cursor-pointer group relative"
                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                            >
                                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {day.count} views
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 transform rotate-45 origin-top-left">
                                                {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Pages */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Top Pages</h2>
                            <div className="space-y-3">
                                {stats?.topPages?.map((page, index) => {
                                    const maxViews = stats.topPages[0]?.views || 1;
                                    const percentage = (page.views / maxViews) * 100;

                                    return (
                                        <div key={index} className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">{page._id || 'Homepage'}</span>
                                                    <span className="text-sm font-bold text-gray-900">{page.views} views</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Top Countries */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h2 className="text-lg font-bold text-gray-800">Top Countries</h2>
                                </div>
                                <div className="space-y-3">
                                    {stats?.topCountries?.length > 0 ? (
                                        stats.topCountries.map((country, index) => {
                                            const maxCount = stats.topCountries[0]?.count || 1;
                                            const percentage = (country.count / maxCount) * 100;
                                            const countryCode = country._id || 'Unknown';
                                            const flag = getCountryFlag(countryCode);

                                            return (
                                                <div key={index} className="flex items-center gap-3">
                                                    <span className="text-xl">{flag}</span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-700">{countryCode}</span>
                                                            <span className="text-sm font-bold text-gray-900">{country.count}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-sm">No location data yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Cities */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <h2 className="text-lg font-bold text-gray-800">Top Cities</h2>
                                </div>
                                <div className="space-y-3">
                                    {stats?.topCities?.length > 0 ? (
                                        stats.topCities.map((city, index) => {
                                            const maxCount = stats.topCities[0]?.count || 1;
                                            const percentage = (city.count / maxCount) * 100;
                                            const cityName = city._id?.city || 'Unknown';
                                            const countryCode = city._id?.country || '';

                                            return (
                                                <div key={index} className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {cityName}{countryCode && `, ${countryCode}`}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-900">{city.count}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-sm">No location data yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
