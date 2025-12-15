import { Heart, Eye, Users, Clock, CheckCircle, Share2, Check } from "lucide-react";
import { useLikeVideo } from '@/hooks/useLikeVideo';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const VideoDetails = ({ video, userLiked, userDisliked }) => {
    const { user } = useAuth();
    const [shareText, setShareText] = useState('Share');

    // ... (existing logic)

    // Logic from LikeDislikeButtons
    const {
        liked,
        likesCount,
        handleLike,
    } = useLikeVideo({
        liked: userLiked,
        disliked: userDisliked,
        likesCount: video.likesCount || 0,
        dislikesCount: video.dislikesCount || 0,
    });

    const formatCount = (num) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num || 0);

    const handleShare = async () => {
        const urlObj = new URL(window.location.href);
        if (user?._id) {
            urlObj.searchParams.set('ref', user._id);
        }
        const shareUrl = urlObj.toString();
        const shareData = {
            title: video.title,
            text: `Check out "${video.title}" on EthioxHub!`,
            url: shareUrl,
        };

        try {
            // Try Web Share API (works on mobile and some desktop browsers)
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(shareUrl);
                setShareText('Copied!');
                setTimeout(() => setShareText('Share'), 2000);
            }
        } catch (err) {
            // If user cancels or error, show fallback
            if (err.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    setShareText('Copied!');
                    setTimeout(() => setShareText('Share'), 2000);
                } catch (clipboardErr) {
                    console.error('Share failed:', clipboardErr);
                }
            }
        }
    };

    return (
        <div className="mt-6 space-y-6">
            {/* Creator & Actions Row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Creator Info */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={video.owner?.profilePicture || "https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png"}
                            alt="Creator avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-foreground font-semibold">{video.owner?.username || "Unknown"}</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                        <span className="text-muted-foreground text-sm">{video.owner?.subscribersCount || "0"} subscribers</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-2.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                    >
                        {shareText === 'Copied!' ? (
                            <Check className="w-5 h-5 text-green-500" />
                        ) : (
                            <Share2 className="w-5 h-5 text-foreground" />
                        )}
                        <span className="text-foreground font-medium">{shareText}</span>
                    </button>

                    {/* Like Button */}
                    <button
                        onClick={() => handleLike(video._id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-colors ${liked ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
                    >
                        <Heart className={`w-5 h-5 ${liked ? 'text-primary-foreground' : 'text-foreground'}`} fill={liked ? "currentColor" : "none"} />
                        <span className={`${liked ? 'text-primary-foreground' : 'text-foreground'} font-medium`}>{liked ? 'Liked' : 'Like'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{formatCount(video.views)} views</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span>{formatCount(likesCount)} likes</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{formatCount((video.views || 0) * 0.8)} streaming</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    {video.title}
                </h1>
                <div className="space-y-4 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    <p>
                        {video.description}
                    </p>
                </div>
            </div>
        </div>
    );
};
export default VideoDetails;
