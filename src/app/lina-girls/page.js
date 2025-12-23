'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LinaGirlsPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unlocking, setUnlocking] = useState(null);
    const [playingVoice, setPlayingVoice] = useState(null);
    const [userBalance, setUserBalance] = useState(null);

    useEffect(() => {
        fetchProfiles();
        fetchUserBalance();
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

    const fetchUserBalance = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await fetch('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setUserBalance(result.user.balance);
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
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
                    setUserBalance(result.newBalance);
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 flex items-center justify-center">
                <div className="animate-pulse text-white text-3xl font-extrabold">
                    Lina Agency
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 py-8 px-4 sm:px-6 lg:px-12">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
                >
                    Lina Girls Profiles 💕
                </motion.h1>

                <p className="text-white text-lg mb-4">
                    የአገልግሎት ክፍያ 1000 ብር Click Unlock ❤️ to reveal contact details
                </p>

                {userBalance !== null && (
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-white font-bold">
                        Your Balance: {userBalance.toLocaleString()} ETB
                    </div>
                )}
            </header>

            {/* Error State */}
            {error && (
                <div className="max-w-7xl mx-auto text-center text-white mb-8">
                    <p className="text-xl mb-4">{error}</p>
                    <button
                        onClick={fetchProfiles}
                        className="py-2 px-6 bg-teal-600 rounded-full hover:bg-teal-700 transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Profiles Grid */}
            {profiles.length === 0 ? (
                <p className="text-white text-center text-xl">No profiles available yet.</p>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {profiles.map((profile) => (
                        <motion.div
                            key={profile._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-2"
                        >
                            {/* Photo */}
                            <div className="relative w-full h-96">
                                <img
                                    src={profile.photoUrl}
                                    alt={profile.name}
                                    className={`w-full h-full object-cover ${!profile.isUnlocked ? 'opacity-70' : ''}`}
                                    loading="lazy"
                                />
                            </div>

                            {/* Details */}
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold text-indigo-900">
                                        {profile.name}
                                    </h2>
                                    <button
                                        onClick={() => toggleVoice(profile._id)}
                                        className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition"
                                    >
                                        {playingVoice === profile._id ? '⏸' : '▶'}
                                    </button>
                                </div>
                                <audio id={`audio-${profile._id}`} src={`/audio/${profile.voiceId}.mp3`} />

                                <p className="text-sm text-gray-700">
                                    {profile.age} yrs | {profile.city}, {profile.country}
                                </p>

                                {profile.neighborhood && (
                                    <p className="text-sm text-gray-600">Area: {profile.neighborhood}</p>
                                )}

                                <p className="text-sm text-gray-700 mt-1">
                                    Salary: {profile.localSalary ? 'Local (5k-10k)' : ''}{' '}
                                    {profile.localSalary && profile.intlSalary ? '|' : ''}{' '}
                                    {profile.intlSalary ? 'Intl (15k-20k)' : ''}
                                </p>

                                <p className="text-sm text-gray-700 mt-1 font-bold">
                                    Contact: {profile.contactInfo}
                                </p>

                                {/* Additional Photos (Unlocked Only) */}
                                {profile.additionalPhotos?.length > 0 && (
                                    <div className="mt-3 flex space-x-2 overflow-x-auto">
                                        {profile.additionalPhotos.map((photo, index) => (
                                            <img
                                                key={index}
                                                src={photo}
                                                alt={`Extra ${index + 1}`}
                                                className="w-16 h-16 object-cover rounded-xl shadow-md hover:scale-110 transition"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Unlock Button */}
                                {!profile.isUnlocked && (
                                    <button
                                        onClick={() => handleUnlock(profile._id)}
                                        disabled={unlocking === profile._id}
                                        className="w-full mt-4 py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow hover:from-teal-600 hover:to-teal-800 transition disabled:opacity-50"
                                    >
                                        {unlocking === profile._id ? 'Unlocking...' : 'Unlock Profile (1000 ETB)'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
