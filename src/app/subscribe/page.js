'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) return router.push('/login');
        if (loading) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                alert('Welcome to VIP! 🚀');
                router.push('/');
            } else {
                alert(data.error);
                if (data.error.includes('balance')) router.push('/deposit');
            }
        } catch (e) {
            alert('Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <div className="pt-32 px-4 flex justify-center">
                <div className="card max-w-md w-full text-center p-8 bg-gradient-to-br from-dark-900 to-dark-800 border border-primary-500/30 shadow-2xl shadow-primary-500/10">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl rotate-3 mb-6 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-display font-bold text-white mb-2">EthioxHub VIP</h1>
                    <p className="text-primary-300 font-medium text-lg mb-6">Unlock All Content</p>

                    <div className="space-y-4 mb-8 text-left max-w-xs mx-auto text-dark-300">
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>Access to ALL premium videos</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>Ad-free experience</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>Support creators directly</span>
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-white mb-8">
                        100 ETB
                        <span className="text-base font-normal text-dark-400"> / month</span>
                    </div>

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="btn btn-primary w-full py-4 text-lg shadow-lg shadow-primary-600/20 hover:scale-105 transition-transform"
                    >
                        {loading ? 'Processing...' : 'Upgrade Now'}
                    </button>

                    <p className="mt-4 text-xs text-dark-500">
                        Secure payment via your wallet balance. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
}
