'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VideoCardWithPreview from '@/components/VideoCardWithPreview';
import ContinueWatching from '@/components/ContinueWatching';
import { useFilterVideos } from '@/hooks/useFilterVideos';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import CookieBanner from '@/components/CookieBanner';

function HomePageContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search');

    // Initialize with search query if present
    const {
        videos,
        categories,
        loading,
        pagination,
        filters,
        updateFilters,
        resetFilters,
        goToPage,
    } = useFilterVideos({
        search: searchQuery || '',
        sort: 'newest'
    });

    // Update filters when URL search param changes
    useEffect(() => {
        if (searchQuery !== null) {
            updateFilters('search', searchQuery);
        }
    }, [searchQuery]);

    // Pagination helper (Matching History Page Style)
    const getPageNumbers = () => {
        if (!pagination) return [];
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, pagination.page - 2);
        let end = Math.min(pagination.pages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Main Content - adjusted for fixed navbar + nav + banner */}
            <div className="pt-[128px]">
                <main className="container mx-auto px-4 py-6 pb-32">
                    {/* Continue Watching Section */}
                    <ContinueWatching />

                    {/* Popular Tags Section */}
                    <section className="mb-2">
                        <h2 className="mb-3 text-xl font-bold text-white">
                            {t('hotCourseVideos')}
                        </h2>
                        <div className="flex w-full justify-between items-center overflow-x-auto pb-2 no-scrollbar gap-2">
                            <button
                                onClick={() => updateFilters('category', '')}
                                className={`flex-1 min-w-[60px] px-3 py-1.5 rounded border text-sm whitespace-nowrap transition-colors text-center ${filters.category === ''
                                    ? 'bg-white text-black border-white'
                                    : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                    }`}
                            >
                                {t('all')}
                            </button>
                            {/* Static categories for display if API is empty/loading, or just map API */}
                            {categories.length > 0 ? categories.map((category) => (
                                <button
                                    key={category._id}
                                    onClick={() => updateFilters('category', category.slug)}
                                    className={`flex-1 px-3 py-1.5 rounded border text-sm whitespace-nowrap transition-colors text-center ${filters.category === category.slug
                                        ? 'bg-white text-black border-white'
                                        : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            )) : (
                                // Fallback/default categories if none loaded yet
                                ['Comedy', 'Education', 'Entertainment', 'Gaming', 'Music', 'News', 'Sports', 'Technology'].map((cat) => (
                                    <button
                                        key={cat}
                                        className="flex-1 px-3 py-1.5 rounded border border-gray-700 bg-gray-800 text-white text-sm whitespace-nowrap hover:bg-gray-700 text-center"
                                    >
                                        {cat}
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Sort Options */}
                    <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
                        <span className="text-gray-500 text-sm font-medium whitespace-nowrap">Sort by:</span>
                        <div className="flex gap-2">
                            {[
                                { label: 'Most Viewed', value: 'views' },
                                { label: 'Recent Uploads', value: 'newest' },
                                { label: 'Most Liked', value: 'likes' },
                                { label: 'Premium', value: 'premium' },
                                { label: 'Free', value: 'free' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => updateFilters('sort', option.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filters.sort === option.value
                                        ? 'bg-white text-black border-white'
                                        : 'bg-black/40 text-gray-400 border-gray-700 hover:text-white hover:border-gray-500 hover:bg-black/60'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Results Header */}
                    {filters.search && (
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                Search results for "{filters.search}"
                            </h2>
                            <button
                                onClick={() => {
                                    updateFilters('search', '');
                                    // Also clear URL param
                                    window.history.pushState({}, '', '/');
                                }}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                Clear search
                            </button>
                        </div>
                    )}

                    {/* Video Grid Section */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-800 aspect-video rounded-xl mb-3"></div>
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 bg-gray-800 rounded-full flex-shrink-0"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                                            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.length > 0 ? (
                        <>
                            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                                {videos.map((video) => (
                                    <VideoCardWithPreview key={video._id} video={video} />
                                ))}
                            </section>

                            {/* Pagination Controls - Identical to History Page */}
                            {pagination && pagination.pages > 1 && (
                                <div className="mt-12 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => goToPage(Math.max(pagination.page - 1, 1))}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('previous')}
                                    </button>

                                    {getPageNumbers().map(pageNum => (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`w-10 h-10 rounded flex items-center justify-center font-medium transition-colors ${pagination.page === pageNum
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => goToPage(Math.min(pagination.page + 1, pagination.pages))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                    >
                                        {t('next')}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <svg className="w-20 h-20 mx-auto text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-400 text-lg mb-4">{t('noVideosFound')}</p>
                            <button
                                onClick={resetFilters}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                {t('resetFilters')}
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Functional Cookie Consent Banner */}
            <CookieBanner />
        </div>
    );
}

// Wrap in Suspense for useSearchParams
export default function HomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-foreground">Loading...</div></div>}>
            <HomePageContent />
        </Suspense>
    );
}
