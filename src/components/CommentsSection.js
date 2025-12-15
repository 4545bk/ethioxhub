/**
 * CommentsSection Component
 * Displays threaded comments with replies, posting, and moderation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentItem from './CommentItem';

export default function CommentsSection({ videoId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComments();
    }, [videoId, page]);

    const fetchComments = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/videos/${videoId}/comments?page=${page}&limit=20`);

            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();

            if (page === 1) {
                setComments(data.comments || []);
            } else {
                setComments(prev => [...prev, ...(data.comments || [])]);
            }

            setHasMore(data.pagination && data.pagination.page < data.pagination.pages);
            setLoading(false);

        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();

        if (!commentText.trim()) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Please login to post comments');
            return;
        }

        setPosting(true);
        setError(null);

        try {
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ text: commentText }),
            });

            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to post comment');
            }

            const data = await response.json();

            // Add new comment to top
            setComments(prev => [data.comment, ...prev]);
            setCommentText('');
            setPosting(false);

            if (data.moderated) {
                alert('Your comment has been flagged for moderation.');
            }

        } catch (err) {
            console.error('Error posting comment:', err);
            setError(err.message);
            setPosting(false);
            if (err.message !== 'Failed to post comment') {
                // alert(err.message); // avoid double alert
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
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
                throw new Error('Failed to delete comment');
            }

            // Remove comment from state
            setComments(prev => prev.filter(c => c._id !== commentId));

        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Failed to delete comment');
        }
    };

    const handleReplyPosted = (parentId, newReply) => {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => {
            if (comment._id === parentId) {
                return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply],
                    repliesCount: (comment.repliesCount || 0) + 1,
                };
            }
            return comment;
        }));
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6">
            {/* Header */}
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="mb-8">
                <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                    maxLength="1000"
                />
                <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-400">
                        {commentText.length}/1000
                    </span>
                    <button
                        type="submit"
                        disabled={posting || !commentText.trim()}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${posting || !commentText.trim()
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {posting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
                <AnimatePresence>
                    {comments.map((comment) => (
                        <motion.div
                            key={comment._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CommentItem
                                comment={comment}
                                videoId={videoId}
                                onDelete={handleDeleteComment}
                                onReplyPosted={handleReplyPosted}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {comments.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                    </div>
                )}
            </div>

            {/* Load More */}
            {hasMore && !loading && comments.length > 0 && (
                <button
                    onClick={() => setPage(prev => prev + 1)}
                    className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                    Load More Comments
                </button>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
}
