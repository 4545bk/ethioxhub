/**
 * useLikeVideo Hook
 * Manages video like/dislike interactions with optimistic UI updates
 */

import { useState, useEffect } from 'react';

export function useLikeVideo(initialState = {}) {
    const [liked, setLiked] = useState(initialState.liked || false);
    const [disliked, setDisliked] = useState(initialState.disliked || false);
    const [likesCount, setLikesCount] = useState(initialState.likesCount || 0);
    const [dislikesCount, setDislikesCount] = useState(initialState.dislikesCount || 0);
    const [loading, setLoading] = useState(false);

    // Sync state with props when they change (e.g., when user loads)
    useEffect(() => {
        setLiked(initialState.liked || false);
        setDisliked(initialState.disliked || false);
        setLikesCount(initialState.likesCount || 0);
        setDislikesCount(initialState.dislikesCount || 0);
    }, [initialState.liked, initialState.disliked, initialState.likesCount, initialState.dislikesCount]);

    const handleLike = async (videoId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Please login to like videos');
            return;
        }

        if (loading) return;

        // Optimistic update
        const wasLiked = liked;
        const wasDisliked = disliked;
        const initialLikesCount = likesCount;
        const initialDislikesCount = dislikesCount;

        setLiked(!liked);
        if (liked) {
            setLikesCount(prev => Math.max(0, prev - 1));
        } else {
            setLikesCount(prev => prev + 1);
            if (disliked) {
                setDisliked(false);
                setDislikesCount(prev => Math.max(0, prev - 1));
            }
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to like video');
            }

            const data = await response.json();

            // Update with server response
            setLiked(data.liked);
            setLikesCount(data.likesCount);
            setDislikesCount(data.dislikesCount);

        } catch (error) {
            console.error('Error liking video:', error);

            // Rollback optimistic update
            setLiked(wasLiked);
            setDisliked(wasDisliked);
            setLikesCount(initialLikesCount);
            setDislikesCount(initialDislikesCount);

            if (error.message !== 'Failed to like video') {
                alert('Failed to like video. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDislike = async (videoId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Please login to dislike videos');
            return;
        }

        if (loading) return;

        // Optimistic update
        const wasLiked = liked;
        const wasDisliked = disliked;
        const initialLikesCount = likesCount;
        const initialDislikesCount = dislikesCount;

        setDisliked(!disliked);
        if (disliked) {
            setDislikesCount(prev => Math.max(0, prev - 1));
        } else {
            setDislikesCount(prev => prev + 1);
            if (liked) {
                setLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            }
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/videos/${videoId}/dislike`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to dislike video');
            }

            const data = await response.json();

            // Update with server response
            setDisliked(data.disliked);
            setLikesCount(data.likesCount);
            setDislikesCount(data.dislikesCount);

        } catch (error) {
            console.error('Error disliking video:', error);

            // Rollback optimistic update
            setLiked(wasLiked);
            setDisliked(wasDisliked);
            setLikesCount(initialLikesCount);
            setDislikesCount(initialDislikesCount);

            if (error.message !== 'Failed to dislike video') {
                alert('Failed to dislike video. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        liked,
        disliked,
        likesCount,
        dislikesCount,
        loading,
        handleLike,
        handleDislike,
    };
}
