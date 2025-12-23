'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useToast } from '@/contexts/ToastContext';

export default function LinaProfileView({ id }) {
    const router = useRouter();
    const toast = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch(`/api/lina/profiles/${id}`, { headers });
            const data = await res.json();

            if (data.success) {
                setProfile(data.profile);
            } else {
                toast.error('Profile not found');
                router.push('/lina-girls');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            router.push('/lina-girls');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    Loading...
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-[128px] pb-32">
                <main className="container mx-auto px-4 py-6">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/lina-girls')}
                        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to All Profiles
                    </button>

                    {/* Profile Card - Centered */}
                    <div className="max-w-md mx-auto">
                        <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                            {/* Photo */}
                            <div className="relative w-full h-96">
                                <img
                                    src={profile.photoUrl}
                                    alt={profile.name}
                                    className={`w-full h-full object-cover ${!profile.isUnlocked ? 'opacity-70' : ''}`}
                                />
                            </div>

                            {/* Details */}
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-white mb-3">{profile.name}</h1>

                                <p className="text-sm text-gray-400 mb-3">
                                    {profile.age} yrs • {profile.city}, {profile.country}
                                </p>

                                {profile.neighborhood && (
                                    <p className="text-xs text-gray-500 mb-3">
                                        📍 {profile.neighborhood}
                                    </p>
                                )}

                                <p className="text-xs text-gray-400 mb-4">
                                    💼 {profile.localSalary ? 'Local (5k-10k)' : ''}{' '}
                                    {profile.localSalary && profile.intlSalary ? '• ' : ''}{' '}
                                    {profile.intlSalary ? 'Intl (15k-20k)' : ''}
                                </p>

                                {profile.isUnlocked ? (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-green-600/10 border border-green-600 rounded-lg">
                                            <p className="text-sm text-white font-bold mb-1">📞 Contact:</p>
                                            <p className="text-lg text-green-400 font-bold">{profile.contactInfo}</p>
                                        </div>

                                        {profile.telegramUsername && (
                                            <a
                                                href={`https://t.me/${profile.telegramUsername.replace(/^@/, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg font-bold text-center shadow-md transition flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                </svg>
                                                Telegram: {profile.telegramUsername}
                                            </a>
                                        )}

                                        {profile.additionalPhotos?.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-400 mb-2">Additional Photos:</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {profile.additionalPhotos.map((photo, index) => (
                                                        <img
                                                            key={index}
                                                            src={photo}
                                                            alt={`Extra ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg shadow-md"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                                            <svg className="w-12 h-12 text-orange-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-gray-400 mb-4">This profile is locked</p>
                                            <p className="text-2xl font-bold text-orange-500 mb-2">1000 ETB</p>
                                            <p className="text-xs text-gray-500">to unlock contact info</p>
                                        </div>

                                        <button
                                            onClick={() => router.push('/lina-girls')}
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition"
                                        >
                                            View All Profiles
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
