/**
 * Watch History Page
 * Displays user's watch history with Pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clearing, setClearing] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const router = useRouter();

    useEffect(() => {
        fetchHistory(currentPage);
    }, [currentPage]);

    const fetchHistory = async (page) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Please login to view history');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Using limit=20 as requested
            const response = await fetch(`/api/user/history?page=${page}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            setHistory(data.history || []);
            setTotalPages(data.pagination?.pages || 1);
            setTotalItems(data.pagination?.total || 0);

            setLoading(false);

        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear your entire watch history? This cannot be undone.')) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        setClearing(true);

        try {
            const response = await fetch('/api/user/history', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to clear history');
            }

            setHistory([]);
            setTotalItems(0);
            setTotalPages(1);
            setClearing(false);

        } catch (err) {
            console.error('Error clearing history:', err);
            alert('Failed to clear history');
            setClearing(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Pagination helper
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-gray-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Watch History
                        </h1>
                        <p className="text-gray-400">
                            {totalItems > 0
                                ? `Showing ${(currentPage - 1) * 20 + 1}-${Math.min(currentPage * 20, totalItems)} of ${totalItems} videos`
                                : 'No videos watched yet'}
                            <span className="ml-2 text-gray-500 text-xs">(Limited to last 500 total)</span>
                        </p>
                    </div>

                    {/* Clear History Button */}
                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            disabled={clearing}
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${clearing
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {clearing ? 'Clearing...' : 'Clear History'}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && history.length === 0 && (
                    <div className="text-center py-20">
                        <svg className="w-24 h-24 mx-auto text-gray-600 mb-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">No Watch History</h2>
                        <p className="text-gray-400 mb-6">
                            Videos you watch will appear here
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Browse Videos
                        </Link>
                    </div>
                )}

                {/* History List */}
                {!loading && history.length > 0 && (
                    <>
                        <div className="space-y-6">
                            <AnimatePresence>
                                {history.map((entry) => {
                                    const video = entry.videoId;
                                    if (!video) return null;

                                    return (
                                        <motion.div
                                            key={entry._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
                                        >
                                            <Link href={`/videos/${video._id}`}>
                                                <div className="flex gap-4 p-4">
                                                    {/* Thumbnail */}
                                                    <div className="flex-shrink-0 w-64 aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                                                        <img
                                                            src={video.thumbnailUrl || '/placeholder-video.png'}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {video.duration > 0 && (
                                                            <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-xs text-white rounded">
                                                                {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-blue-400 transition-colors">
                                                            {video.title}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                                            {video.description || 'No description'}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                {/* Optional: Add profile pic if available in video.owner */}
                                                                <span className="font-medium text-gray-300">{video.owner?.username || 'Unknown'}</span>
                                                            </div>
                                                            <span>•</span>
                                                            <span>{video.views || 0} views</span>
                                                            {video.category && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                                                                        {video.category.name}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 text-xs text-gray-500">
                                                            Watched {formatDate(entry.watchedAt)}
                                                        </div>
                                                    </div>

                                                    {/* Badges */}
                                                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                        {video.isPaid ? (
                                                            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                                                                {(video.price / 100).toFixed(2)} ETB
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                                                FREE
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>

                                {getPageNumbers().map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded flex items-center justify-center font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
