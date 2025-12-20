import React from 'react';
import { MoreHorizontal, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SourceOfPurchases = ({ sources }) => {
    // Transform sources object to array
    const total = sources.direct + sources.google + sources.social + sources.other || 1;

    const data = [
        { name: 'Social Media', value: sources.social || 0, color: 'hsl(217, 91%, 60%)' },
        { name: 'Google', value: sources.google || 0, color: 'hsl(25, 95%, 53%)' },
        { name: 'Direct', value: sources.direct || 0, color: 'hsl(142, 71%, 45%)' },
        { name: 'Others', value: sources.other || 0, color: 'hsl(214, 32%, 91%)' },
    ].filter(d => d.value > 0);

    const hasData = data.length > 0 && total > 0;

    // Get dominant source
    const dominantSource = hasData
        ? data.reduce((max, item) => item.value > max.value ? item : max, data[0])
        : null;

    return (
        <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Traffic Sources</h3>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {hasData ? (
                <>
                    <div className="flex items-center gap-4">
                        {/* Donut Chart */}
                        <div className="relative w-36 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold text-gray-900">{total}</p>
                                <p className="text-xs text-gray-500">Visitors</p>
                            </div>
                        </div>

                        {/* Top Source */}
                        <div className="flex-1">
                            {dominantSource && (
                                <div className="text-xs text-gray-600 mb-2">
                                    <span className="font-semibold text-blue-600">
                                        {Math.round((dominantSource.value / total) * 100)}%
                                    </span>
                                    <p className="text-gray-500 mt-1">{dominantSource.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-2 my-4">
                        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-full flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium">GLOBAL TRAFFIC</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2">
                        {data.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                    {Math.round((item.value / total) * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                    <p className="text-sm">No traffic source data</p>
                </div>
            )}
        </div>
    );
};

export default SourceOfPurchases;
