import React from 'react';
import { ChevronDown } from 'lucide-react';

const PeakTrafficChart = ({ peakHours }) => {
    // peakHours is array of 24 numbers
    if (!peakHours) peakHours = Array(24).fill(0);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Peak Traffic Hours</h3>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    Total (24h)
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            <div className="h-64 flex items-end justify-between gap-1 pt-4">
                {peakHours.map((count, hour) => {
                    const maxPeak = Math.max(...peakHours, 1);
                    const height = (count / maxPeak) * 100;

                    return (
                        <div key={hour} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity z-10 whitespace-nowrap">
                                {hour}:00 - {count} visits
                            </div>

                            {/* Bar */}
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-80
                                ${hour >= 8 && hour <= 20 ? 'bg-blue-500' : 'bg-blue-200'}
                            `}
                                style={{ height: `${height}%` }}
                            />

                            {/* Hour label */}
                            <span className="text-[10px] text-gray-400 mt-2">
                                {hour % 4 === 0 ? hour : ''}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(191 219 254)' }}></span>
                    <span>Off-Peak</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(59 130 246)' }}></span>
                    <span>Business Hours</span>
                </div>
            </div>
        </div>
    );
};

export default PeakTrafficChart;
