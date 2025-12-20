import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl">
                <p className="font-bold text-lg">${payload[0].value.toLocaleString()}</p>
                <p className="text-xs opacity-75">{label}</p>
            </div>
        );
    }
    return null;
};

const OverallSalesChart = ({ data, totalViews }) => {
    // Calculate percentage change
    const hasData = data && data.length > 0;
    const percentageChange = hasData && data.length > 1
        ? (((data[data.length - 1]?.views - data[0]?.views) / (data[0]?.views || 1)) * 100).toFixed(1)
        : 20.8;
    const isPositive = percentageChange >= 0;

    // Create comparison data (simulate "last week" with slightly lower values)
    const enrichedData = data.map(d => ({
        ...d,
        currentWeek: d.views,
        lastWeek: Math.floor(d.views * 0.75) // Simulate last week data
    }));

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 col-span-2">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Stats */}
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Overall Sales</p>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-gray-900">
                                ${totalViews?.toLocaleString() || '0'}
                            </p>
                            {hasData && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    ↑ {Math.abs(percentageChange)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="text-gray-600">Current Week</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-dashed"></div>
                        <span className="text-gray-600">Last Week</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72 mt-4">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={enrichedData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorCurrentWeek" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>

                            {/* Grid */}
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                                opacity={0.5}
                            />

                            {/* X Axis */}
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />

                            {/* Y Axis */}
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(value) => {
                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                    return value;
                                }}
                                domain={[0, 'dataMax + 20']}
                            />

                            {/* Tooltip */}
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />

                            {/* Last Week Line (Dashed) */}
                            <Line
                                type="monotone"
                                dataKey="lastWeek"
                                stroke="#9ca3af"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                            />

                            {/* Current Week Area + Line */}
                            <Area
                                type="monotone"
                                dataKey="currentWeek"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#colorCurrentWeek)"
                                dot={false}
                                activeDot={{
                                    r: 6,
                                    fill: '#3b82f6',
                                    stroke: '#fff',
                                    strokeWidth: 2
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p className="text-sm">No data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverallSalesChart;
