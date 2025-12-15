'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoCard({ video }) {
    const { id, _id, title, thumbnailUrl, duration, views, owner, isPaid, price } = video;
    const videoId = id || _id; // Support both forms

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count;
    };

    return (
        <Link href={`/video/${videoId}`}>
            <motion.div
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
            >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-800">
                    {thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
                            <svg className="w-16 h-16 text-dark-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}

                    {/* Overlay Effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Duration Badge */}
                    {duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-medium text-white">
                            {formatDuration(duration)}
                        </div>
                    )}

                    {/* VIP Badge */}
                    {isPaid && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-xs font-bold text-white shadow-lg">
                            VIP
                        </div>
                    )}

                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Video Info */}
                <div className="mt-3 space-y-1">
                    <h3 className="font-semibold text-dark-100 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {title}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-dark-400">
                        <span className="line-clamp-1">{owner?.username || 'Unknown'}</span>
                        {isPaid && price > 0 && (
                            <span className="text-primary-400 font-semibold">
                                {(price / 100).toFixed(2)} ETB
                            </span>
                        )}
                        {!isPaid && (
                            <span className="text-success-400 font-semibold">Free</span>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-dark-500">
                        <span>{formatViews(views || 0)} views</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
