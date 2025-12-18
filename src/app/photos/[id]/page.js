'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function PhotoDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        fetchPhoto();
    }, [params.id]);

    const fetchPhoto = async () => {
        try {
            const res = await fetch(`/api/photos/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setPhoto(data.photo);
            } else {
                toast.error('Photo not found');
                router.push('/photos');
            }
        } catch (err) {
            console.error('Error fetching photo:', err);
            toast.error('Failed to load photo');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!user) {
            toast.error('Please login to purchase');
            router.push('/login');
            return;
        }

        setPurchasing(true);
        try {
            const res = await fetch(`/api/photos/${photo._id}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Purchase successful!');
                fetchPhoto(); // Reload to get access
            } else {
                toast.error(data.error || 'Purchase failed');
            }
        } catch (err) {
            toast.error('Purchase failed');
        } finally {
            setPurchasing(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error('Please login to like');
            return;
        }

        try {
            const res = await fetch(`/api/photos/${photo._id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });

            if (res.ok) {
                fetchPhoto(); // Reload to update likes
            }
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const sharePhoto = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: photo.title,
                text: photo.description || photo.title,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    const images = photo?.album && photo.album.length > 0 ? photo.album : [photo?.url];
    const totalImages = images.length;
    const hasAccess = photo && (!photo.isPaid || photo.purchased);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
            </div>
        );
    }

    if (!photo) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Navbar />
                <div className="flex items-center justify-center h-screen text-white">
                    Photo not found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/photos')}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Gallery
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Image Section */}
                    <div className="lg:col-span-2">
                        <div className="relative bg-black rounded-xl overflow-hidden">
                            {hasAccess ? (
                                <>
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={photo.title}
                                        className="w-full h-auto max-h-[600px] object-contain"
                                    />

                                    {/* Album Navigation */}
                                    {totalImages > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % totalImages)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                                {currentImageIndex + 1} / {totalImages}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={photo.url}
                                        alt={photo.title}
                                        className="w-full h-auto max-h-[600px] object-contain blur-xl"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                        <div className="text-center text-white p-8">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                                            <p className="text-gray-300 mb-4">Purchase to unlock {totalImages > 1 ? `all ${totalImages} photos` : 'this photo'}</p>
                                            <p className="text-3xl font-bold text-yellow-500 mb-4">{(photo.price / 100).toFixed(2)} ETB</p>
                                            <button
                                                onClick={handlePurchase}
                                                disabled={purchasing}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-lg disabled:opacity-50 transition-all"
                                            >
                                                {purchasing ? 'Processing...' : 'Unlock Now'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
                            <h1 className="text-2xl font-bold text-white mb-4">{photo.title}</h1>

                            {photo.description && (
                                <p className="text-gray-300 mb-6">{photo.description}</p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 mb-6 text-gray-400">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{photo.views || 0} views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    <span>{photo.likes?.length || 0} likes</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleLike}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${photo.likes?.includes(user?._id)
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    {photo.likes?.includes(user?._id) ? 'Liked' : 'Like'}
                                </button>

                                <button
                                    onClick={sharePhoto}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            </div>

                            {/* Photo Info */}
                            <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400">
                                <div className="flex justify-between mb-2">
                                    <span>Type:</span>
                                    <span className="text-white">{photo.isPaid ? 'Premium' : 'Free'}</span>
                                </div>
                                {totalImages > 1 && (
                                    <div className="flex justify-between mb-2">
                                        <span>Photos:</span>
                                        <span className="text-white">{totalImages} images</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Uploaded:</span>
                                    <span className="text-white">{new Date(photo.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
