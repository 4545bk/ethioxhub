'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function VideoPlayerPage({ params }) {
    const { id } = params;
    const { user, refreshUser } = useAuth(); // Assume refreshUser exists or user updates strictly on page reload
    const router = useRouter();

    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [access, setAccess] = useState(false); // Can watch?
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [id, user]);

    const fetchVideo = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/videos/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                setVideo(data.video);
                setAccess(data.canAccess);
            } else {
                // If 403/401, mostly we still get video metadata but canAccess=false
                // If API is designed to hide metadata too, then handle here.
                // Assuming API returns { video: { title, isPaid, price... }, canAccess: false } if locked
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!user) return router.push('/login');
        if (!confirm(`Buy this video for ${(video.price / 100).toFixed(2)} ETB?`)) return;

        setPurchasing(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/videos/${id}/purchase`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                alert('Success! Video unlocked.');
                setAccess(true);
                // Ideally refresh user balance in context
                window.location.reload();
            } else {
                alert(data.error);
                if (data.error.includes('balance')) {
                    router.push('/deposit');
                }
            }
        } catch (e) {
            alert('Failed to purchase');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Loading...</div>;
    if (!video) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Video not found</div>;

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            {/* Player Container */}
            <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                    {access ? (
                        <video
                            key={video.videoUrl}
                            controls
                            className="w-full h-full"
                            src={video.videoUrl || video.cloudinaryUrl}
                            poster={video.thumbnailUrl}
                            controlsList="nodownload"
                        />
                    ) : (
                        // Paywall Overlay
                        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Premium Content</h2>
                            <p className="text-dark-300 mb-8 max-w-md">
                                This video is locked. Purchase it for lifetime access or subscribe to watch everything.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="btn btn-primary px-8 py-3 text-lg"
                                >
                                    {purchasing ? 'Processing...' : `Buy for ${(video.price / 100).toFixed(2)} ETB`}
                                </button>
                                <button
                                    onClick={() => router.push('/subscribe')}
                                    className="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-xl font-semibold transition-colors border border-dark-700"
                                >
                                    Subscribe & Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="mt-8 mb-12">
                    <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
                    <div className="flex items-center space-x-4 text-dark-400 mb-6">
                        <span className="px-3 py-1 bg-dark-800 rounded-full text-sm">{video.category}</span>
                        <span>•</span>
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{video.description}</p>
                </div>
            </div>
        </div>
    );
}
