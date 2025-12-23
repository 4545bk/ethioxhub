'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LinaGirlsPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unlocking, setUnlocking] = useState(null);
    const [playingVoice, setPlayingVoice] = useState(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch('/api/lina/profiles', { headers });
            const result = await res.json();

            if (result.success) {
                setProfiles(result.data);
            } else {
                setError(result.error || 'Failed to load profiles');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (profileId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/login?redirect=/lina-girls');
            return;
        }

        if (confirm('Unlock this profile for 1000 ETB?')) {
            setUnlocking(profileId);
            try {
                const res = await fetch('/api/lina/unlock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ profileId })
                });

                const result = await res.json();

                if (result.success) {
                    alert(result.message);
                    fetchProfiles(); // Refresh to show unlocked state
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (err) {
                alert('Failed to unlock profile. Please try again.');
            } finally {
                setUnlocking(null);
            }
        }
    };

    const toggleVoice = (profileId) => {
        const audio = document.getElementById(`audio-${profileId}`);
        if (playingVoice === profileId) {
            audio.pause();
            setPlayingVoice(null);
        } else {
            if (playingVoice) {
                const prevAudio = document.getElementById(`audio-${playingVoice}`);
                if (prevAudio) prevAudio.pause();
            }
            audio.play();
            setPlayingVoice(profileId);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-white text-3xl font-extrabold">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Main Content - adjusted for fixed navbar */}
            <div className="pt-[128px]">
                <main className="container mx-auto px-4 py-6 pb-32">
                    {/* Error State */}
                    {error && (
                        <div className="max-w-7xl mx-auto text-center mb-8">
                            <p className="text-xl mb-4 text-red-400">{error}</p>
                            <button
                                onClick={fetchProfiles}
                                className="py-2 px-6 bg-orange-500 rounded-lg hover:bg-orange-600 transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Profiles Grid */}
                    {profiles.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-white text-xl mb-4">No profiles available yet.</p>
                            <p className="text-gray-400 text-sm">
                                New profiles will appear here once registered.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {profiles.map((profile) => (
                                <motion.div
                                    key={profile._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gray-900 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-800"
                                >
                                    {/* Photo */}
                                    <div className="relative w-full h-80">
                                        <img
                                            src={profile.photoUrl}
                                            alt={profile.name}
                                            className={`w-full h-full object-cover ${!profile.isUnlocked ? 'opacity-70' : ''}`}
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h2 className="text-lg font-semibold text-white truncate">
                                                    {profile.name}
                                                </h2>
                                                <p className="text-[10px] text-orange-400 font-medium animate-pulse">
                                                    Play audio 👉🏻👉🏻
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => toggleVoice(profile._id)}
                                                className="flex-shrink-0 p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition shadow-lg hover:shadow-orange-500/50"
                                                title="Play instructions"
                                            >
                                                {playingVoice === profile._id ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <audio id={`audio-${profile._id}`} src={`/audio/${profile.voiceId}.mp3`} />

                                        <p className="text-sm text-gray-400 mb-2">
                                            {profile.age} yrs • {profile.city}, {profile.country}
                                        </p>

                                        {profile.neighborhood && (
                                            <p className="text-xs text-gray-500 mb-2">
                                                📍 {profile.neighborhood}
                                            </p>
                                        )}

                                        <p className="text-xs text-gray-400 mb-2">
                                            💼 {profile.localSalary ? 'Local (5k-10k)' : ''}{' '}
                                            {profile.localSalary && profile.intlSalary ? '• ' : ''}{' '}
                                            {profile.intlSalary ? 'Intl (15k-20k)' : ''}
                                        </p>

                                        <p className="text-sm text-white font-bold mb-3">
                                            📞 {profile.contactInfo}
                                        </p>

                                        {/* Additional Photos (Unlocked Only) */}
                                        {profile.additionalPhotos?.length > 0 && (
                                            <div className="mb-3 flex space-x-2 overflow-x-auto no-scrollbar">
                                                {profile.additionalPhotos.map((photo, index) => (
                                                    <img
                                                        key={index}
                                                        src={photo}
                                                        alt={`Extra ${index + 1}`}
                                                        className="w-14 h-14 object-cover rounded-lg shadow-md hover:scale-110 transition flex-shrink-0"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Unlock Button */}
                                        {!profile.isUnlocked && (
                                            <button
                                                onClick={() => handleUnlock(profile._id)}
                                                disabled={unlocking === profile._id}
                                                className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium shadow hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {unlocking === profile._id ? '⌛ Unlocking...' : '🔓 Unlock (1000 ETB)'}
                                            </button>
                                        )}

                                        {profile.isUnlocked && (
                                            <div className="w-full py-2 bg-green-600 text-white rounded-lg font-medium text-center">
                                                ✅ Unlocked
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
