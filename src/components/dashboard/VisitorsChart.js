import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
                <p className="font-semibold">{payload[0].value} visitors</p>
            </div>
        );
    }
    return null;
};

const VisitorsChart = ({ data, totalVisitors }) => {
    const hasData = data && data.length > 0;

    return (
        <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Unique Visitors</h3>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="h-32">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 10 }}
                                tickFormatter={(val) => val.split(' ')[0]} // Show only first part of date
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar
                                dataKey="visitors"
                                fill="hsl(217, 91%, 85%)"
                                radius={[2, 2, 0, 0]}
                                activeBar={{ fill: 'hsl(217, 91%, 60%)' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p className="text-xs">No visitor data</p>
                    </div>
                )}
            </div>

            {/* Stats Card */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-lg">📊</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">Total Visitors</p>
                    <p className="text-xs text-gray-600">{totalVisitors?.toLocaleString() || 0} unique visitors</p>
                </div>
            </div>
        </div>
    );
};

export default VisitorsChart;
