import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const CountriesChart = ({ countries }) => {
    // Transform countries data - limit to top 8
    const data = countries.slice(0, 8).map((c, idx) => ({
        country: c._id || 'Unknown',
        visitors: c.visitors,
        color: idx % 2 === 0 ? 'hsl(217, 91%, 60%)' : 'hsl(25, 95%, 53%)'
    }));

    const totalVisitors = countries.reduce((acc, c) => acc + c.visitors, 0);
    const hasData = data.length > 0;

    return (
        <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900">{countries.length} Countries</h3>
                    <p className="text-sm text-gray-600">({totalVisitors.toLocaleString()} Visitors)</p>
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Last 7 days
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            <div className="h-64">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 40, left: 80, bottom: 0 }}
                        >
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 11 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="country"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                                width={75}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    background: 'hsl(217, 91%, 60%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                }}
                            />
                            <Bar dataKey="visitors" radius={[0, 4, 4, 0]} barSize={16}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p className="text-sm">No country data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountriesChart;
