import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Maximize2, Settings, VolumeX, Minimize2, PictureInPicture2 } from "lucide-react";

const VideoPlayer = ({
    videoRef,
    playbackUrl,
    poster,
    isPlaying,
    togglePlay,
    progress, // 0-100
    currentTime,
    duration,
    volume,
    toggleMute,
    toggleFullscreen,
    hlsInstance // Pass HLS instance from parent if using HLS
}) => {
    const [showControls, setShowControls] = useState(true);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [currentQuality, setCurrentQuality] = useState('Auto');
    const [availableQualities, setAvailableQualities] = useState(['Auto', '1080p', '720p', '480p', '360p']);
    const [isPiPSupported, setIsPiPSupported] = useState(false);
    const [isInPiP, setIsInPiP] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef(null);

    // Check PiP support on mount
    useEffect(() => {
        setIsPiPSupported(document.pictureInPictureEnabled);
    }, []);

    // Monitor PiP state
    useEffect(() => {
        if (!videoRef?.current) return;

        const handleEnterPiP = () => setIsInPiP(true);
        const handleLeavePiP = () => setIsInPiP(false);

        videoRef.current.addEventListener('enterpictureinpicture', handleEnterPiP);
        videoRef.current.addEventListener('leavepictureinpicture', handleLeavePiP);

        return () => {
            if (videoRef?.current) {
                videoRef.current.removeEventListener('enterpictureinpicture', handleEnterPiP);
                videoRef.current.removeEventListener('leavepictureinpicture', handleLeavePiP);
            }
        };
    }, [videoRef]);

    const formatTime = (time) => {
        if (!time || isNaN(time)) return "00:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleQualityChange = (quality) => {
        setCurrentQuality(quality);
        setShowQualityMenu(false);

        // If HLS instance is available, change quality
        if (hlsInstance && quality !== 'Auto') {
            const levels = hlsInstance.levels;
            const qualityMap = {
                '1080p': 1080,
                '720p': 720,
                '480p': 480,
                '360p': 360
            };

            const targetHeight = qualityMap[quality];
            const levelIndex = levels.findIndex(level => level.height === targetHeight);

            if (levelIndex !== -1) {
                hlsInstance.currentLevel = levelIndex;
            }
        } else if (hlsInstance && quality === 'Auto') {
            hlsInstance.currentLevel = -1; // Auto quality
        }
    };

    // Picture-in-Picture toggle
    const togglePictureInPicture = async () => {
        if (!videoRef?.current || !isPiPSupported) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP error:', err);
        }
    };

    // Enhanced progress bar seek with dragging
    const handleProgressInteraction = (e) => {
        if (!duration || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (videoRef.current) {
            videoRef.current.currentTime = percent * duration;
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleProgressInteraction(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            handleProgressInteraction(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    return (
        <div
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-video-bg shadow-video group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onMouseMove={() => setShowControls(true)}
        >
            {playbackUrl ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    poster={poster}
                    onClick={togglePlay}
                    playsInline // Important for iOS to prevent auto-fullscreen
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                    <p className="text-white">Video Locked</p>
                </div>
            )}

            {/* Controls Overlay */}
            {playbackUrl && (
                <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Enhanced Progress Bar with Dragging */}
                        <div
                            ref={progressBarRef}
                            className="mb-4 group/progress cursor-pointer"
                            onMouseDown={handleMouseDown}
                            onClick={handleProgressInteraction}
                        >
                            <div className="relative h-1 bg-white/20 rounded-full hover:h-2 transition-all">
                                {/* Progress */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                                {/* Thumb */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                                    style={{ left: `calc(${progress}% - 6px)` }}
                                />
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Play/Pause */}
                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5 text-white" fill="white" />
                                    ) : (
                                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                                    )}
                                </button>

                                {/* Time Display */}
                                <div className="text-white text-sm font-medium">
                                    <span>{formatTime(currentTime)}</span>
                                    <span className="text-white/60 mx-1">/</span>
                                    <span className="text-white/60">{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Volume Control with Slider */}
                                <div className="relative group/volume">
                                    <button
                                        onClick={toggleMute}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        {volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                                    </button>

                                    {/* Volume Slider */}
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none group-hover/volume:pointer-events-auto">
                                        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/10">
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={volume}
                                                onChange={(e) => {
                                                    const newVolume = parseFloat(e.target.value);
                                                    if (videoRef.current) {
                                                        videoRef.current.volume = newVolume;
                                                    }
                                                }}
                                                className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                                                }}
                                            />
                                            <div className="text-white text-xs text-center mt-1">
                                                {Math.round(volume * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quality Settings */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        aria-label="Quality Settings"
                                    >
                                        <Settings className="w-5 h-5 text-white" />
                                    </button>

                                    {/* Quality Menu */}
                                    {showQualityMenu && (
                                        <div className="absolute bottom-12 right-0 bg-black/90 backdrop-blur-sm rounded-lg py-2 min-w-[120px] shadow-lg border border-white/10">
                                            <div className="px-3 py-1 text-xs text-white/60 font-medium">Quality</div>
                                            {availableQualities.map((quality) => (
                                                <button
                                                    key={quality}
                                                    onClick={() => handleQualityChange(quality)}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors ${currentQuality === quality
                                                        ? 'text-primary font-medium'
                                                        : 'text-white'
                                                        }`}
                                                >
                                                    {quality} {currentQuality === quality && '✓'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Picture-in-Picture (Mini Player) */}
                                {isPiPSupported && (
                                    <button
                                        onClick={togglePictureInPicture}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        aria-label="Picture-in-Picture"
                                        title="Mini Player"
                                    >
                                        {isInPiP ? (
                                            <Minimize2 className="w-5 h-5 text-orange-500" />
                                        ) : (
                                            <PictureInPicture2 className="w-5 h-5 text-white" />
                                        )}
                                    </button>
                                )}

                                {/* Fullscreen */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Fullscreen"
                                >
                                    <Maximize2 className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
