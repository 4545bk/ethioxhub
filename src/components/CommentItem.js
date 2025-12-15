/**
 * CommentItem Component
 * Individual comment with replies, delete, and moderation display
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommentItem({ comment, videoId, onDelete, onReplyPosted, isReply = false }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [posting, setPosting] = useState(false);
    const [showAllReplies, setShowAllReplies] = useState(false);

    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const isOwner = comment.userId?._id === currentUser;

    const formatDate = (date) => {
        const now = new Date();
        const commentDate = new Date(date);
        const diffMs = now - commentDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return commentDate.toLocaleDateString();
    };

    const handlePostReply = async (e) => {
        e.preventDefault();

        if (!replyText.trim()) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Please login to reply');
            return;
        }

        setPosting(true);

        try {
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    text: replyText,
                    parentId: comment._id,
                }),
            });

            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to post reply');
            }

            const data = await response.json();

            // Notify parent component
            if (onReplyPosted) {
                onReplyPosted(comment._id, data.comment);
            }

            setReplyText('');
            setShowReplyForm(false);
            setPosting(false);

        } catch (err) {
            console.error('Error posting reply:', err);
            alert(err.message);
            setPosting(false);
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this comment?')) {
            onDelete(comment._id);
        }
    };

    return (
        <div className={`${isReply ? 'ml-12' : ''}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {comment.userId?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                            {comment.userId?.username || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                        </span>
                        {comment.moderated && (
                            <span className="px-2 py-0.5 bg-yellow-900 bg-opacity-50 border border-yellow-600 text-yellow-300 text-xs rounded">
                                Flagged
                            </span>
                        )}
                    </div>

                    {/* Comment Text */}
                    <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap break-words">
                        {comment.text}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm">
                        {!isReply && (
                            <button
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="text-gray-400 hover:text-blue-400 transition-colors font-medium"
                            >
                                Reply
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="text-gray-400 hover:text-red-400 transition-colors font-medium"
                            >
                                Delete
                            </button>
                        )}
                        {comment.repliesCount > 0 && !isReply && (
                            <button
                                onClick={() => setShowAllReplies(!showAllReplies)}
                                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                            >
                                {showAllReplies ? 'Hide' : 'Show'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    <AnimatePresence>
                        {showReplyForm && (
                            <motion.form
                                onSubmit={handlePostReply}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3"
                            >
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows="2"
                                    maxLength="1000"
                                />
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReplyForm(false);
                                            setReplyText('');
                                        }}
                                        className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={posting || !replyText.trim()}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${posting || !replyText.trim()
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {posting ? 'Posting...' : 'Reply'}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Replies */}
                    {showAllReplies && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    videoId={videoId}
                                    onDelete={onDelete}
                                    isReply={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
