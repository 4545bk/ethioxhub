'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/AdminSidebar';
import { Search, Bell, HelpCircle, ChevronDown, SlidersHorizontal, Filter, Calendar, Users, Clock, Eye, MousePointer, Globe, Smartphone } from 'lucide-react';

// Dashboard Components
import OverallSalesChart from '../../../components/dashboard/OverallSalesChart';
import SourceOfPurchases from '../../../components/dashboard/SourceOfPurchases';
import VisitorsChart from '../../../components/dashboard/VisitorsChart';
import CountriesChart from '../../../components/dashboard/CountriesChart';
import PeakTrafficChart from '../../../components/dashboard/PeakTrafficChart';
import ContentPerformance from '../../../components/dashboard/ContentPerformance';
import DailyInsights from '../../../components/dashboard/DailyInsights';
import ConversionFunnel from '../../../components/dashboard/ConversionFunnel';

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // ===== DATA STATE (PRESERVED) =====
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topPages, setTopPages] = useState([]);
    const [topCountries, setTopCountries] = useState([]);
    const [topCities, setTopCities] = useState([]);
    const [devices, setDevices] = useState({ mobile: 0, desktop: 0, tablet: 0 });
    const [sources, setSources] = useState({ direct: 0, google: 0, social: 0, other: 0 });
    const [socialBreakdown, setSocialBreakdown] = useState(null);
    const [funnel, setFunnel] = useState(null);
    const [peakHours, setPeakHours] = useState(Array(24).fill(0));
    const [topVideos, setTopVideos] = useState([]);
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState(null);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [showFilters, setShowFilters] = useState(false);

    // ===== AUTH & DATA FETCHING (PRESERVED) =====
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const isAdmin = user.roles?.includes('admin');

        if (!isAdmin) {
            console.log("Access Denied: User is not admin", user);
            router.push('/');
            return;
        }

        const fetchAnalytics = async () => {
            try {
                const response = await fetch('/api/admin/analytics/traffic');
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Failed to fetch analytics');

                console.log('Analytics Data:', data); // Debug log

                setStats(data.stats);
                setChartData(data.chartData || []);
                setTopPages(data.topPages || []);
                setTopCountries(data.topCountries || []);
                setTopCities(data.topCities || []);
                setDevices(data.devices || { mobile: 0, desktop: 0, tablet: 0 });
                setSources(data.sources || { direct: 0, google: 0, social: 0, other: 0 });
                setSocialBreakdown(data.socialBreakdown || null);
                setFunnel(data.funnel || null);
                setPeakHours(data.peakHours || Array(24).fill(0));
                setTopVideos(data.topVideos || []);
                setInsights(data.insights || null);
            } catch (err) {
                console.error("Analytics Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, authLoading, router]);

    // Format data for charts
    const formattedChartData = chartData.map(d => ({
        date: d.date.split(',')[0],
        views: d.count,
        visitors: d.uniqueVisitors,
    }));

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.substring(0, 2).toUpperCase();
    };

    // Search function
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        // In a real implementation, this would filter the data
        console.log('Searching for:', e.target.value);
    };

    // ===== LOADING STATE =====
    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 analytics-theme">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    // ===== ERROR STATE =====
    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50 analytics-theme">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md border border-gray-100">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== MAIN UI =====
    return (
        <div className="flex min-h-screen bg-gray-50 analytics-theme font-sans">
            {/* AdminSidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                    {/* Search Bar */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2.5 w-80">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search analytics..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="bg-transparent text-sm text-gray-900 placeholder:text-gray-500 outline-none flex-1"
                        />
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <HelpCircle className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
                            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                    {getInitials(user?.username || 'Admin')}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{user?.username || 'Admin'}</p>
                                <p className="text-xs text-blue-600">Administrator</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {/* Page Title & Filters */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Analytics Overview,</h1>
                            <p className="text-sm text-gray-500 uppercase">
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - REAL-TIME
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSortBy(sortBy === 'date' ? 'value' : 'date')}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Sort By: {sortBy === 'date' ? 'Date' : 'Value'}</span>
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Filter {showFilters ? '(Active)' : ''}</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Last 7 Days</span>
                            </button>
                        </div>
                    </div>

                    {/* Daily Insights */}
                    <DailyInsights insights={insights} />

                    {/* Conversion Funnel */}
                    <ConversionFunnel funnel={funnel} />

                    {/* Stats Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Views</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.totalPageViews?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Unique Visitors</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.uniqueVisitors?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Avg. Session</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {Math.floor((stats?.avgSessionDuration || 0) / 60)}m {(stats?.avgSessionDuration || 0) % 60}s
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <MousePointer className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Pages/Session</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.pagesPerSession?.toFixed(1) || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visitor Types Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">New Visitors</p>
                                <Users className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.newVisitors?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats?.uniqueVisitors > 0 ? Math.round((stats.newVisitors / stats.uniqueVisitors) * 100) : 0}% of total
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">Returning</p>
                                <Users className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.returningVisitors?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats?.uniqueVisitors > 0 ? Math.round((stats.returningVisitors / stats.uniqueVisitors) * 100) : 0}% retention
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">Live Now</p>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.liveVisitors?.length || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Active visitors</p>
                        </div>
                    </div>

                    {/* Device & Location Row */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-blue-600" />
                                Device Breakdown
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-700 font-medium">📱 Mobile</span>
                                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">{devices.mobile.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-700 font-medium">💻 Desktop</span>
                                    <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-sm">{devices.desktop.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-700 font-medium">📱 Tablet</span>
                                    <span className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg text-sm">{devices.tablet.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-green-600" />
                                Top Locations
                            </h3>
                            {topCountries.length > 0 ? (
                                <div className="space-y-3">
                                    {topCountries.slice(0, 5).map((country, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                            <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                                                <span className="text-base">
                                                    {country._id === 'US' ? '🇺🇸' :
                                                        country._id === 'ET' ? '🇪🇹' :
                                                            country._id === 'AE' ? '🇦🇪' :
                                                                country._id === 'GB' ? '🇬🇧' : '🌍'}
                                                </span>
                                                {country._id}
                                            </span>
                                            <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg text-sm">
                                                {country.visitors.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 p-2">No location data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-4 gap-5">
                        {/* Row 1 */}
                        <div className="col-span-2">
                            <OverallSalesChart
                                data={formattedChartData}
                                totalViews={stats?.totalPageViews}
                            />
                        </div>
                        <div className="col-span-1">
                            <SourceOfPurchases sources={sources} socialBreakdown={socialBreakdown} />
                        </div>
                        <div className="col-span-1">
                            <VisitorsChart
                                data={formattedChartData}
                                totalVisitors={stats?.uniqueVisitors}
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="col-span-1">
                            <CountriesChart countries={topCountries} />
                        </div>
                        <div className="col-span-2">
                            <PeakTrafficChart peakHours={peakHours} />
                        </div>
                        <div className="col-span-1">
                            <ContentPerformance videos={topVideos} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
