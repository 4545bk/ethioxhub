import React from 'react';
import { SlidersHorizontal, Filter, Calendar } from 'lucide-react';

const FilterBar = ({ onCalendarClick }) => {
    return (
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">Sort By</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">Filter By</span>
            </button>
            <button
                onClick={onCalendarClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Last 7 Days</span>
            </button>
        </div>
    );
};

export default FilterBar;
