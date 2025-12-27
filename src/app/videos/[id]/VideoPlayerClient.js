'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLikeVideo } from '@/hooks/useLikeVideo';
import { optimizeCloudinaryVideoUrl } from '@/utils/videoOptimizer';
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

export default function VideoPlayerClient() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const videoRef = useRef(null);
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playbackUrl, setPlaybackUrl] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userLiked, setUserLiked] = useState(false);
    const [userDisliked, setUserDisliked] = useState(false);

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [wasPiPActive, setWasPiPActive] = useState(false); // Track if PiP was active before navigation
    const previousVideoIdRef = useRef(null); // Track previous video ID

    // Smart PiP Switching: Auto-switch to new video when navigating while in PiP mode
    useEffect(() => {
        const checkAndSwitchPiP = async () => {
            // Check if we're switching to a different video
            const currentVideoId = params.id;
            const previousVideoId = previousVideoIdRef.current;

            if (previousVideoId && previousVideoId !== currentVideoId) {
                // Video changed! Check if we were in PiP mode
                if (document.pictureInPictureElement) {
                    console.log('🔄 Switching PiP from old video to new video...');
                    setWasPiPActive(true);

                    // Exit PiP from old video
                    try {
                        await document.exitPictureInPicture();
                    } catch (err) {
                        console.log('PiP exit error (normal during navigation):', err);
                    }
                } else {
                    setWasPiPActive(false);
                }
            }

            // Update the previous video ID
            previousVideoIdRef.current = currentVideoId;
        };

        checkAndSwitchPiP();
    }, [params.id]);

    // Auto-enter PiP for new video if user was in PiP mode
    useEffect(() => {
        const autoEnterPiP = async () => {
            if (wasPiPActive && videoRef.current && playbackUrl && video) {
                console.log('🎬 Attempting to auto-enter PiP for new video...');

                // Wait for video to be fully loaded
                const waitForVideoReady = () => {
                    return new Promise((resolve) => {
                        if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
                            resolve();
                        } else {
                            const handleCanPlay = () => {
                                videoRef.current.removeEventListener('canplay', handleCanPlay);
                                resolve();
                            };
                            videoRef.current.addEventListener('canplay', handleCanPlay);

                            // Timeout after 3 seconds
                            setTimeout(() => {
                                videoRef.current.removeEventListener('canplay', handleCanPlay);
                                resolve();
                            }, 3000);
                        }
                    });
                };

                try {
                    // Wait for video to be ready
                    await waitForVideoReady();

                    // Small additional delay for browser processing
                    await new Promise(resolve => setTimeout(resolve, 200));

                    if (videoRef.current && document.pictureInPictureEnabled) {
                        // Ensure video is playing before entering PiP
                        if (videoRef.current.paused) {
                            await videoRef.current.play();
                        }

                        await videoRef.current.requestPictureInPicture();
                        console.log('✅ Auto-switched to new video in PiP mode');
                        setWasPiPActive(false); // Reset flag
                    }
                } catch (err) {
                    console.log('Auto PiP entry failed:', err);
                    setWasPiPActive(false);
                }
            }
        };

        autoEnterPiP();
    }, [playbackUrl, wasPiPActive, video]);

    useEffect(() => {
        fetchVideo();
    }, [params.id, authLoading]);

    // Update like/dislike state when user loads
    useEffect(() => {
        if (video && user) {
            setUserLiked(video.likedBy?.includes(user._id) || false);
            setUserDisliked(video.dislikedBy?.includes(user._id) || false);
        }
    }, [video, user]);

    // Initialize player when playbackUrl and videoRef are ready
    useEffect(() => {
        if (playbackUrl && videoRef.current) {
            console.log('🎯 Both playbackUrl and videoRef ready, initializing player...');
            initializePlayer(playbackUrl);
        }
    }, [playbackUrl, videoRef.current]);

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

                // Check if user is authenticated
                const isAuthenticated = !!token && !!user;

                // Check if user has access (purchased, subscribed, free, or admin)
                if (data.canAccess && data.video.videoUrl) {
                    const optimizedUrl = optimizeCloudinaryVideoUrl(data.video.videoUrl);

                    // Allow free videos to play without login (freemium strategy)
                    if (!data.video.isPaid) {
                        setPlaybackUrl(optimizedUrl);
                    } else if (isAuthenticated) {
                        // Paid videos require authentication
                        setPlaybackUrl(optimizedUrl);
                    }
                } else if (data.video.isPaid && !data.canAccess) {
                    // Show purchase modal for paid videos when user doesn't have access
                    if (!authLoading) setShowPurchaseModal(true);
                } else if (!data.video.isPaid && data.video.videoUrl) {
                    // Free video - allow access without login
                    setPlaybackUrl(optimizeCloudinaryVideoUrl(data.video.videoUrl));
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
        if (!url || !videoRef.current) {
            console.error('❌ Cannot initialize player:', { url: !!url, videoRef: !!videoRef.current });
            return;
        }

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
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('❌ HLS Error:', data);
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
                const error = videoRef.current.error;
                console.error('❌ Video load error:', {
                    code: error?.code,
                    message: error?.message,
                    MEDIA_ERR_ABORTED: error?.code === 1,
                    MEDIA_ERR_NETWORK: error?.code === 2,
                    MEDIA_ERR_DECODE: error?.code === 3,
                    MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
                    videoSrc: videoRef.current?.src
                });
            });

            videoRef.current.addEventListener('loadedmetadata', () => {
                if (videoRef.current) {
                    console.log('✅ Video metadata loaded. Duration:', videoRef.current.duration);
                }
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

        // Check if already in fullscreen
        const isFullscreen = document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        if (isFullscreen) {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // Enter fullscreen
            const container = videoRef.current.parentElement;

            // Try native fullscreen API first (works on desktop and Android)
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
            // iOS Safari specific - fullscreen the video element itself
            else if (videoRef.current.webkitEnterFullscreen) {
                videoRef.current.webkitEnterFullscreen();
            }
            // iOS Safari older versions
            else if (videoRef.current.webkitEnterFullScreen) {
                videoRef.current.webkitEnterFullScreen();
            }
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

            {/* Login Modal for Free Videos */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white">Sign In Required</h2>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mx-auto mb-4">
                                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-center">
                                Please sign in to your account to watch this video.
                            </p>
                            <p className="text-gray-400 text-sm text-center mt-2">
                                It's free and only takes a minute!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                            >
                                Create Account
                            </button>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
