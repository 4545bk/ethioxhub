/**
 * ContinueWatching Component
 * Displays incomplete videos with progress bars for easy resuming
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContinueWatching() {
    const { t } = useLanguage();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        fetchContinueWatching();
    }, []);

    const fetchContinueWatching = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/user/continue-watching', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch continue watching');
            }

            const data = await response.json();
            setVideos(data.continueWatching || []);
            setLoading(false);

        } catch (err) {
            console.error('Error fetching continue watching:', err);
            setLoading(false);
        }
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth',
            });
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!loading && videos.length === 0) {
        return null; // Don't show section if no videos
    }

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    {t('continueWatching')}
                </h2>

                {/* Scroll Buttons */}
                {videos.length > 3 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Videos Carousel */}
            {!loading && (
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {videos.map(progress => {
                        const video = progress.videoId;
                        if (!video) return null;

                        return (
                            <Link
                                key={progress._id}
                                href={`/videos/${video._id}?resume=true`}
                                className="flex-shrink-0 w-80"
                            >
                                <motion.div
                                    className="group cursor-pointer"
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Thumbnail with Progress */}
                                    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                                        <img
                                            src={video.thumbnailUrl || '/placeholder-video.png'}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${progress.progressPercent}%` }}
                                            />
                                        </div>

                                        {/* Duration */}
                                        {video.duration > 0 && (
                                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                                                {formatDuration(video.duration)}
                                            </div>
                                        )}

                                        {/* Resume Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                                            <div className="bg-blue-600 rounded-full p-4">
                                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <h3 className="text-white font-semibold mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                            {video.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <span>{video.owner?.username || 'Unknown'}</span>
                                            <span>{Math.round(progress.progressPercent)}% watched</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
