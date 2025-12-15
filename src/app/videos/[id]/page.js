'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import PurchaseModal from '@/components/PurchaseModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import Hls from 'hls.js';

// New Player Components
import Sidebar from "@/components/video/Sidebar";
import Header from "@/components/video/Header";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoDetails from "@/components/video/VideoDetails";
import RelatedVideos from "@/components/video/RelatedVideos";

export default function VideoPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const videoRef = useRef(null);
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playbackUrl, setPlaybackUrl] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [userLiked, setUserLiked] = useState(false);
    const [userDisliked, setUserDisliked] = useState(false);

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        fetchVideo();
    }, [params.id]);

    // Update like/dislike state when user loads
    useEffect(() => {
        if (video && user) {
            setUserLiked(video.likedBy?.includes(user._id) || false);
            setUserDisliked(video.dislikedBy?.includes(user._id) || false);
        }
    }, [video, user]);

    // Auto-resume from continue watching
    useEffect(() => {
        if (videoRef.current && searchParams.get('resume') === 'true') {
            fetchProgress();
        }
    }, [playbackUrl]);

    // Setup video event listeners
    useEffect(() => {
        if (!videoRef.current) return;

        const videoElement = videoRef.current;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            setCurrentTime(videoElement.currentTime);
            setProgress((videoElement.currentTime / videoElement.duration) * 100 || 0);
        };
        const handleLoadedMetadata = () => {
            setDuration(videoElement.duration);
        };
        const handleVolumeChange = () => {
            setVolume(videoElement.volume);
        };

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('volumechange', handleVolumeChange);

        return () => {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.removeEventListener('volumechange', handleVolumeChange);
        };
    }, [playbackUrl]);

    // Track watch progress
    useEffect(() => {
        if (!videoRef.current || !video) return;

        const videoElement = videoRef.current;
        let progressInterval;

        const saveProgress = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token || !videoElement.duration) return;

            const progressPercent = (videoElement.currentTime / videoElement.duration) * 100;

            try {
                await fetch(`/api/videos/${video._id}/progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        progressPercent,
                        lastPositionSec: videoElement.currentTime,
                        watchDurationSec: videoElement.currentTime,
                    }),
                });
            } catch (err) {
                console.error('Failed to save progress:', err);
            }
        };

        const handlePlay = () => {
            progressInterval = setInterval(saveProgress, 10000);
        };

        const handlePause = () => {
            clearInterval(progressInterval);
            saveProgress();
        };

        const handleEnded = () => {
            clearInterval(progressInterval);
            saveProgress();
        };

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('ended', handleEnded);

        return () => {
            clearInterval(progressInterval);
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('ended', handleEnded);
        };
    }, [video, playbackUrl]);

    const fetchVideo = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch(`/api/videos/${params.id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setVideo(data.video);
                setUserLiked(data.video.likedBy?.includes(user?._id) || false);
                setUserDisliked(data.video.dislikedBy?.includes(user?._id) || false);

                // Check if user has access (purchased, subscribed, free, or admin)
                if (data.canAccess && data.video.videoUrl) {
                    setPlaybackUrl(data.video.videoUrl);
                    initializePlayer(data.video.videoUrl);
                } else if (data.video.isPaid && !data.canAccess) {
                    setShowPurchaseModal(true);
                } else if (!data.video.isPaid && data.video.videoUrl) {
                    setPlaybackUrl(data.video.videoUrl);
                    initializePlayer(data.video.videoUrl);
                }

                // Store userId for comments/likes
                if (user?._id) {
                    localStorage.setItem('userId', user._id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch video:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/videos/${params.id}/progress`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.progress && videoRef.current) {
                    videoRef.current.currentTime = data.progress.lastPositionSec || 0;
                }
            }
        } catch (err) {
            console.error('Failed to fetch progress:', err);
        }
    };

    const initializePlayer = (url) => {
        if (!url || !videoRef.current) return;

        console.log('🎬 Initializing player with URL:', url);

        // Check if it's an HLS stream (.m3u8)
        if (url.includes('.m3u8')) {
            console.log('📡 Using HLS.js for streaming');
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ HLS manifest loaded');
                });
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = url;
            }
        } else {
            // Direct video file (MP4, WebM, etc.) - YOUR CLOUDINARY VIDEOS
            console.log('🎥 Using direct video URL');
            videoRef.current.src = url;

            videoRef.current.addEventListener('loadeddata', () => {
                console.log('✅ Video loaded and ready to play');
            });

            videoRef.current.addEventListener('error', (e) => {
                console.error('❌ Video error:', videoRef.current.error);
            });
        }
    };

    // Video control functions
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.volume = volume === 0 ? 1 : 0;
    };

    const toggleFullscreen = () => {
        if (!videoRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoRef.current.parentElement.requestFullscreen();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex">
                <Sidebar user={user} />
                <div className="flex-1 flex flex-col">
                    <Header user={user} />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                    </div>
                </div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-background flex">
                <Sidebar user={user} />
                <div className="flex-1 flex flex-col">
                    <Header user={user} />
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground">Video not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header user={user} />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row gap-6 p-6 pt-0">
                        {/* Left Side - Video & Details */}
                        <div className="flex-1 min-w-0">
                            <VideoPlayer
                                videoRef={videoRef}
                                playbackUrl={playbackUrl}
                                poster={video.thumbnailUrl}
                                isPlaying={isPlaying}
                                togglePlay={togglePlay}
                                progress={progress}
                                currentTime={currentTime}
                                duration={duration}
                                volume={volume}
                                toggleMute={toggleMute}
                                toggleFullscreen={toggleFullscreen}
                            />
                            <VideoDetails
                                video={video}
                                userLiked={userLiked}
                                userDisliked={userDisliked}
                            />

                            {/* Comments Section */}
                            <div className="mt-8">
                                <CommentsSection videoId={video._id} />
                            </div>
                        </div>

                        {/* Right Side - Related Videos */}
                        <div className="w-full lg:w-80 xl:w-96">
                            <RelatedVideos
                                currentVideoId={video._id}
                                categoryId={video.category?._id || video.category}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                video={video}
                onSuccess={() => {
                    setShowPurchaseModal(false);
                    fetchVideo();
                }}
            />

            <SubscriptionModal
                isOpen={showSubscribeModal}
                onClose={() => setShowSubscribeModal(false)}
                onSuccess={() => {
                    setShowSubscribeModal(false);
                    fetchVideo();
                }}
            />
        </div>
    );
}
