'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useNotification } from '@/contexts/NotificationContext';

export default function PhotosPage() {
    const { user, refreshUser } = useAuth();
    const { fetchNotifications } = useNotification();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [purchaseModal, setPurchaseModal] = useState(null);
    const [processingPurchase, setProcessingPurchase] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch('/api/photos?limit=50', { headers }); // Fetch 50
            if (res.ok) {
                const data = await res.json();
                setPhotos(data.photos || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (e, photo) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Please login to like');
            return;
        }

        // Optimistic update
        setPhotos(prev => prev.map(p => {
            if (p._id === photo._id) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
                };
            }
            return p;
        }));

        try {
            await fetch(`/api/photos/${photo._id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        } catch (error) {
            // Revert on error
            toast.error('Failed to like');
            fetchPhotos();
        }
    };


    const handlePurchase = (e, photo) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Please login to purchase');
            return;
        }
        setPurchaseModal(photo);
    };

    const confirmPurchase = async () => {
        if (!purchaseModal) return;
        setProcessingPurchase(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/photos/${purchaseModal._id}/buy`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                if (data.message === 'Already unlocked') {
                    toast.info('You already own this photo');
                } else {
                    toast.success('Photo Unlocked Successfully!');
                }

                // Optimistic Update
                setPhotos(prev => prev.map(p => {
                    if (p._id === purchaseModal._id) {
                        return { ...p, canView: true };
                    }
                    return p;
                }));

                // Refresh User (Balance) & Notifications
                await Promise.all([refreshUser(), fetchNotifications()]);

                // Force Refetch
                fetchPhotos();

                setPurchaseModal(null);
            } else {
                if (res.status === 402) {
                    toast.error('Insufficient balance. Please deposit funds.');
                } else {
                    toast.error(data.error || 'Failed to purchase');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Error processing purchase');
        } finally {
            setProcessingPurchase(false);
        }
    };

    const handlePhotoClick = (photo) => {
        if (!photo.canView && !user?.roles?.includes('admin')) {
            toast.info('This is a Premium photo. Please unlock to view.');
            return;
        }
        setSelectedPhoto(photo);
        setCurrentImageIndex(0);
    };

    const handleNext = (e) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;

        // Album Navigation
        if (selectedPhoto.album && selectedPhoto.album.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % selectedPhoto.album.length);
            return;
        }

        // Feed Navigation (Single Photos)
        const viewable = photos.filter(p => p.canView || user?.roles?.includes('admin'));
        if (viewable.length <= 1) return;

        const currentIdx = viewable.findIndex(p => p._id === selectedPhoto._id);
        const nextIdx = (currentIdx + 1) % viewable.length;
        setSelectedPhoto(viewable[nextIdx]);
        setCurrentImageIndex(0);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;

        // Album Navigation
        if (selectedPhoto.album && selectedPhoto.album.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + selectedPhoto.album.length) % selectedPhoto.album.length);
            return;
        }

        // Feed Navigation (Single Photos)
        const viewable = photos.filter(p => p.canView || user?.roles?.includes('admin'));
        if (viewable.length <= 1) return;

        const currentIdx = viewable.findIndex(p => p._id === selectedPhoto._id);
        const prevIdx = (currentIdx - 1 + viewable.length) % viewable.length;
        setSelectedPhoto(viewable[prevIdx]);
        setCurrentImageIndex(0);
    };

    // Keyboard navigation
    useEffect(() => {
        if (!selectedPhoto) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedPhoto(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, photos]);

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            <div className="container mx-auto px-4 py-8 pt-24">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Photos Gallery</h1>
                    {/* Add filters if needed */}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl">No photos available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                            <motion.div
                                key={photo._id}
                                layoutId={`photo-${photo._id}`}
                                className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group bg-dark-900 border border-dark-800"
                                onClick={() => handlePhotoClick(photo)}
                                whileHover={{ y: -5 }}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!photo.canView ? 'blur-md' : ''}`}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold truncate">{photo.title}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 text-white/90">
                                            <button
                                                onClick={(e) => handleLike(e, photo)}
                                                className={`p-1.5 rounded-full backdrop-blur-sm ${photo.isLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-white/10 hover:bg-white/20'}`}
                                            >
                                                <svg className={`w-5 h-5 ${photo.isLiked ? 'fill-current' : 'none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </button>
                                            <span className="text-sm">{photo.likesCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Album Indicator */}
                                {photo.album && photo.album.length > 1 && (
                                    <div className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-md backdrop-blur-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {photo.isPaid && (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg">
                                        VIP
                                    </div>
                                )}

                                {!photo.canView && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                                        <svg className="w-12 h-12 text-yellow-500 mb-2 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-white font-bold drop-shadow-md">Premium Content</span>
                                        {photo.price > 0 ? (
                                            <button
                                                onClick={(e) => handlePurchase(e, photo)}
                                                className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-1 px-3 rounded-full text-sm transition-colors shadow-lg"
                                            >
                                                Unlock for {(photo.price / 100).toFixed(2)} ETB
                                            </button>
                                        ) : (
                                            <Link href="/pricing" onClick={(e) => e.stopPropagation()} className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-1 px-3 rounded-full text-sm transition-colors shadow-lg">
                                                Unlock Access
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Lightbox / Modal */}
                <AnimatePresence>
                    {selectedPhoto && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <button
                                className="absolute top-4 right-4 text-white/50 hover:text-white p-2 z-50 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                                onClick={() => setSelectedPhoto(null)}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            {/* Navigation Buttons */}
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-colors z-40"
                                onClick={handlePrev}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-colors z-40"
                                onClick={handleNext}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <motion.img
                                key={selectedPhoto.album?.length > 1 ? currentImageIndex : selectedPhoto._id} // Force re-render for internal swipe
                                layoutId={`photo-${selectedPhoto._id}`}
                                src={(selectedPhoto.album && selectedPhoto.album.length > 0) ? selectedPhoto.album[currentImageIndex] : selectedPhoto.url}
                                alt={selectedPhoto.title}
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Counter for Album */}
                            {selectedPhoto.album && selectedPhoto.album.length > 1 && (
                                <div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {selectedPhoto.album.length}
                                </div>
                            )}

                            <div className="absolute bottom-4 left-0 right-0 text-center p-4">
                                <h2 className="text-xl text-white font-bold mb-1">{selectedPhoto.title}</h2>
                                {selectedPhoto.description && <p className="text-gray-400">{selectedPhoto.description}</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Purchase Confirmation Modal */}
                <AnimatePresence>
                    {purchaseModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => !processingPurchase && setPurchaseModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-dark-900 border border-dark-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Unlock Photo</h3>
                                <p className="text-gray-300 mb-6">
                                    Unlock "<span className="font-semibold text-white">{purchaseModal.title}</span>" for <span className="font-semibold text-yellow-500">{(purchaseModal.price / 100).toFixed(2)} ETB</span>?
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPurchaseModal(null)}
                                        disabled={processingPurchase}
                                        className="flex-1 px-4 py-2 rounded-lg bg-dark-800 text-gray-300 font-medium hover:bg-dark-700 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmPurchase}
                                        disabled={processingPurchase}
                                        className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {processingPurchase ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            'Unlock Now'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
