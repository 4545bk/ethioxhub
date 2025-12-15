import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const RelatedVideos = ({ currentVideoId, categoryId }) => {
    const router = useRouter();
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchRelatedVideos();
    }, [currentVideoId, categoryId]);

    const fetchRelatedVideos = async () => {
        try {
            // Build query params for related videos
            const params = new URLSearchParams({
                limit: 20, // Fetch more to ensure we have enough after filtering
                sort: 'views', // Sort by views for relevance
            });

            // Filter by category if available
            if (categoryId) {
                params.append('category', categoryId);
            }

            const res = await fetch(`/api/videos?${params}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out current video
                const filtered = data.videos.filter(v => v._id !== currentVideoId);

                // If we have related videos from the category, use them
                if (filtered.length > 0) {
                    setRelatedVideos(filtered.slice(0, 10));
                    setTotalCount(data.pagination?.total || 0);
                } else {
                    // Fallback: fetch videos without category filter to always show something
                    const fallbackParams = new URLSearchParams({
                        limit: 15,
                        sort: 'views',
                    });
                    const fallbackRes = await fetch(`/api/videos?${fallbackParams}`);
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        const fallbackFiltered = fallbackData.videos.filter(v => v._id !== currentVideoId);
                        setRelatedVideos(fallbackFiltered.slice(0, 10));
                        setTotalCount(fallbackData.pagination?.total || 0);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch related videos:', err);
            // Even on error, try to fetch some videos
            try {
                const fallbackRes = await fetch('/api/videos?limit=10&sort=views');
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    const fallbackFiltered = fallbackData.videos.filter(v => v._id !== currentVideoId);
                    setRelatedVideos(fallbackFiltered.slice(0, 10));
                }
            } catch (fallbackErr) {
                console.error('Fallback fetch also failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatViews = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count;
    };

    const formatTime = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-4">
                <h3 className="text-foreground font-semibold text-lg mb-4">Related Videos</h3>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-28 h-20 bg-muted rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Always show the component, even if empty - UI consistency

    return (
        <div className="bg-card rounded-2xl p-4">
            {/* Header */}
            <h3 className="text-foreground font-semibold text-lg mb-4">Related Videos</h3>

            {/* Video List or Empty State */}
            {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                    {relatedVideos.map((video) => (
                        <div
                            key={video._id}
                            onClick={() => router.push(`/videos/${video._id}`)}
                            className="flex gap-3 cursor-pointer group"
                        >
                            <div className="relative flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-secondary">
                                <img
                                    src={video.thumbnailUrl || '/placeholder-video.jpg'}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {video.isPaid && (
                                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                        VIP
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-foreground font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                    {video.title}
                                </h4>
                                <p className="text-muted-foreground text-xs mt-1">
                                    {video.owner?.username || 'Unknown'}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {formatViews(video.views || 0)} views • {formatTime(video.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No related videos available</p>
                </div>
            )}

            {/* See All Button */}
            {totalCount > 10 && relatedVideos.length > 0 && (
                <button
                    onClick={() => router.push(categoryId ? `/categories/${categoryId}` : '/')}
                    className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full transition-colors"
                >
                    See All related videos ({totalCount})
                </button>
            )}
        </div>
    );
};

export default RelatedVideos;
