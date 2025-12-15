/**
 * FiltersSidebar Component
 * Advanced filtering for videos with category, price, duration, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FiltersSidebar({ filters, onFilterChange, onReset, categories = [] }) {
    const [isOpen, setIsOpen] = useState(true);
    const [priceRange, setPriceRange] = useState({
        min: filters.minPrice || '',
        max: filters.maxPrice || '',
    });
    const [durationRange, setDurationRange] = useState({
        min: filters.minDuration || '',
        max: filters.maxDuration || '',
    });

    const handlePriceChange = (type, value) => {
        setPriceRange(prev => ({ ...prev, [type]: value }));
    };

    const handleDurationChange = (type, value) => {
        setDurationRange(prev => ({ ...prev, [type]: value }));
    };

    const applyPriceFilter = () => {
        if (priceRange.min) onFilterChange('minPrice', parseInt(priceRange.min) * 100); // Convert to cents
        if (priceRange.max) onFilterChange('maxPrice', parseInt(priceRange.max) * 100);
    };

    const applyDurationFilter = () => {
        if (durationRange.min) onFilterChange('minDuration', parseInt(durationRange.min) * 60); // Convert to seconds
        if (durationRange.max) onFilterChange('maxDuration', parseInt(durationRange.max) * 60);
    };

    const handleReset = () => {
        setPriceRange({ min: '', max: '' });
        setDurationRange({ min: '', max: '' });
        onReset();
    };

    return (
        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 bg-gray-800 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                    </svg>
                    Filters
                </h3>
                <motion.svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </div>

            {/* Filters Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-6">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={filters.category || ''}
                                    onChange={(e) => onFilterChange('category', e.target.value)}
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.slug}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Free/Paid Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Content Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => onFilterChange('isPaid', '')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.isPaid === ''
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => onFilterChange('isPaid', 'false')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.isPaid === 'false'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                    >
                                        Free
                                    </button>
                                    <button
                                        onClick={() => onFilterChange('isPaid', 'true')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.isPaid === 'true'
                                                ? 'bg-yellow-600 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                    >
                                        Paid
                                    </button>
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Price Range (ETB)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => handlePriceChange('min', e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => handlePriceChange('max', e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={applyPriceFilter}
                                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                >
                                    Apply Price
                                </button>
                            </div>

                            {/* Duration Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Duration (minutes)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={durationRange.min}
                                        onChange={(e) => handleDurationChange('min', e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={durationRange.max}
                                        onChange={(e) => handleDurationChange('max', e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={applyDurationFilter}
                                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                >
                                    Apply Duration
                                </button>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sort || 'newest'}
                                    onChange={(e) => onFilterChange('sort', e.target.value)}
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="views">Most Viewed</option>
                                    <option value="likes">Most Liked</option>
                                    <option value="trending">Trending</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Reset Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
