/**
 * LikeDislikeButtons Component
 * Thumbs up/down with optimistic UI updates
 */

'use client';

import { motion } from 'framer-motion';
import { useLikeVideo } from '@/hooks/useLikeVideo';

export default function LikeDislikeButtons({
    videoId,
    initialLikes = 0,
    initialDislikes = 0,
    userLiked = false,
    userDisliked = false
}) {
    const {
        liked,
        disliked,
        likesCount,
        dislikesCount,
        loading,
        handleLike,
        handleDislike,
    } = useLikeVideo({
        liked: userLiked,
        disliked: userDisliked,
        likesCount: initialLikes,
        dislikesCount: initialDislikes,
    });

    const onLike = () => {
        handleLike(videoId);
    };

    const onDislike = () => {
        handleDislike(videoId);
    };

    const formatCount = (count) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    return (
        <div className="flex items-center gap-2">
            {/* Like Button */}
            <motion.button
                onClick={onLike}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${liked
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
            >
                <svg
                    className={`w-5 h-5 transition-transform ${liked ? 'scale-110' : ''}`}
                    fill={liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={liked ? 0 : 2}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                    />
                </svg>
                <span className="text-sm font-semibold">
                    {formatCount(likesCount)}
                </span>
            </motion.button>

            {/* Dislike Button */}
            <motion.button
                onClick={onDislike}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${disliked
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
            >
                <svg
                    className={`w-5 h-5 transition-transform ${disliked ? 'scale-110 rotate-180' : 'rotate-180'}`}
                    fill={disliked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={disliked ? 0 : 2}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                    />
                </svg>
                <span className="text-sm font-semibold">
                    {formatCount(dislikesCount)}
                </span>
            </motion.button>
        </div>
    );
}
