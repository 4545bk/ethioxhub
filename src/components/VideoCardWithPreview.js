/**
 * VideoCardWithPreview Component
 * YouTube-style video card with hover preview
 * Keeps all existing functionality (preview, links, etc.)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useVideoPreview } from '@/hooks/useVideoPreview';

export default function VideoCardWithPreview({ video }) {
    const [isHovering, setIsHovering] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const { previewUrl } = useVideoPreview(video);
    const hoverTimeoutRef = useRef(null);
    const videoRef = useRef(null);

    // Handle preview playback
    useEffect(() => {
        if (showPreview && videoRef.current && previewUrl) {
            videoRef.current.load(); // Ensure fresh load
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Preview playback failed for:', video.title?.substring(0, 30), error.message);
                    // On playback failure, hide the preview and show thumbnail instead
                    setShowPreview(false);
                });
            }
        } else if (!showPreview && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [showPreview, previewUrl, video.title]);

    const handleMouseEnter = () => {
        setIsHovering(true);

        // Start preview after 500ms hover
        hoverTimeoutRef.current = setTimeout(() => {
            if (previewUrl) {
                setShowPreview(true);
            }
        }, 500);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        setShowPreview(false);
        setShowMenu(false); // Close menu on leave

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (views) => {
        if (!views) return '0';
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div
            className="group relative cursor-pointer flex flex-col gap-3"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link href={`/videos/${video._id}`} className="block">
                {/* Thumbnail / Preview Container */}
                <div className="relative overflow-hidden rounded-xl bg-gray-900 aspect-video">
                    {/* Thumbnail (always visible initially) */}
                    <img
                        src={video.thumbnailUrl || '/placeholder-video.png'}
                        alt={video.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'
                            }`}
                    />

                    {/* Video Preview (on hover) */}
                    {previewUrl && (
                        <video
                            ref={videoRef}
                            src={previewUrl}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'
                                }`}
                            muted
                            loop
                            playsInline
                            onError={(e) => {
                                console.warn('Preview video failed to load:', video.title?.substring(0, 30), previewUrl.substring(0, 60));
                                setShowPreview(false); // Fallback to thumbnail
                            }}
                        />
                    )}

                    {/* Duration Badge (bottom right) */}
                    {video.duration > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                            {formatDuration(video.duration)}
                        </div>
                    )}
                </div>
            </Link>

            {/* Card Content */}
            <div className="flex gap-3 px-1">
                {/* Instructor Avatar */}
                <Link href={`/profile/${video.owner?._id}`} className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                        {video.owner?.profilePicture ? (
                            <img src={video.owner.profilePicture} alt={video.owner.username} className="w-full h-full object-cover" />
                        ) : (
                            video.owner?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                </Link>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                    <Link href={`/videos/${video._id}`}>
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                            {video.title}
                        </h3>
                    </Link>

                    <Link href={`/profile/${video.owner?._id}`} className="block text-gray-400 text-xs hover:text-white transition-colors mb-0.5">
                        {video.owner?.username || 'Unknown Instructor'}
                    </Link>

                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <span>{formatViews(video.views)} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(video.createdAt)}</span>
                    </div>

                    {/* Paid/Free Badge - Optional but helpful */}
                    <div className="mt-1">
                        {video.isPaid ? (
                            <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                PREMIUM
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                                FREE
                            </span>
                        )}
                    </div>
                </div>

                {/* Three-dot Menu */}
                <div className="flex-shrink-0 relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="text-gray-400 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-8 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
                            <Link
                                href={`/videos/${video._id}`}
                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Watch Video
                                </div>
                            </Link>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Save to Watch Later
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
