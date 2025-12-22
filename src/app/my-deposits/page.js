'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function MyDepositsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return; // Wait for auth check  
        if (!user) {
            router.push('/login');
            return;
        }
        fetchDeposits();
    }, [user, authLoading]);

    const fetchDeposits = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/deposits/my-deposits', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Deposits received:', data.deposits);
                setDeposits(data.deposits || []);
            }
        } catch (err) {
            console.error('Failed to fetch deposits:', err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) return null;

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
            approved: 'bg-success-500/10 text-success-400 border-success-500/20',
            rejected: 'bg-error-500/10 text-error-400 border-error-500/20',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-display font-bold text-white mb-2">My Deposits</h1>
                    <p className="text-dark-400 mb-8">Track your deposit requests and their status</p>

                    {loading ? (
                        <div className="card text-center py-12">
                            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-dark-400 mt-4">Loading deposits...</p>
                        </div>
                    ) : deposits.length === 0 ? (
                        <div className="card text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-dark-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No Deposits Yet</h3>
                            <p className="text-dark-400 mb-4">You haven't made any deposit requests</p>
                            <button onClick={() => router.push('/deposit')} className="btn btn-primary">
                                Make a Deposit
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deposits.map((deposit) => (
                                <motion.div
                                    key={deposit._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="space-y-2">
                                                {/* Log for debugging */}
                                                {console.log('Deposit item:', {
                                                    id: deposit._id,
                                                    amount: deposit.amount,
                                                    metadata: deposit.metadata,
                                                    source: deposit.metadata?.source,
                                                    originalAmount: deposit.metadata?.originalAmount
                                                })}

                                                {/* Detect if Polar payment - check source OR notes field */}
                                                {(() => {
                                                    const isPolar = deposit.metadata?.source === 'polar' ||
                                                        deposit.metadata?.notes?.includes('Polar') ||
                                                        deposit.metadata?.notes?.includes('International card payment');

                                                    // Get or calculate USD amount
                                                    const conversionRate = deposit.metadata?.conversionRate || 60;
                                                    const usdAmount = deposit.metadata?.originalAmount || (deposit.amount / conversionRate);

                                                    return (
                                                        <>
                                                            <div className="flex items-center space-x-2">
                                                                {isPolar ? (
                                                                    <>
                                                                        <span className="text-xl">💳</span>
                                                                        <span className="text-xl font-bold text-white">
                                                                            {(deposit.amount / 100).toFixed(2)} ETB
                                                                            <span className="text-base text-dark-400 ml-2">
                                                                                (${(usdAmount / 100).toFixed(2)} Dollars)
                                                                            </span>
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-xl">💰</span>
                                                                        <span className="text-xl font-bold text-white">
                                                                            {(deposit.amount / 100).toFixed(2)} ETB
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Payment method badge */}
                                                            <div className="flex items-center space-x-2">
                                                                {isPolar ? (
                                                                    <>
                                                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                                                                            International Card Payment
                                                                        </span>
                                                                        <span className="text-xs text-dark-500">
                                                                            (Rate: 1 USD = {conversionRate} ETB)
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                                                                        Bank Transfer
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </>
                                                    );
                                                })()}

                                                <div className="flex items-center space-x-2">
                                                    <span className="text-dark-400">⏳ Status:</span>
                                                    {getStatusBadge(deposit.status)}
                                                </div>

                                                <div className="flex items-center space-x-2 text-dark-300">
                                                    <span>🆔 Transaction ID:</span>
                                                    <span className="font-mono text-dark-200">{deposit._id}</span>
                                                </div>

                                                <div className="flex items-center space-x-2 text-dark-300">
                                                    <span>📅 Date:</span>
                                                    <span>{new Date(deposit.createdAt).toLocaleString()}</span>
                                                </div>

                                                {(deposit.senderName || deposit.metadata?.senderName) && (
                                                    <div className="flex items-center space-x-2 text-dark-300">
                                                        <span>📤 Sender:</span>
                                                        <span className="text-white">{deposit.senderName || deposit.metadata?.senderName || 'Unknown'}</span>
                                                    </div>
                                                )}

                                                {deposit.adminNote && (
                                                    <div className="mt-2 p-3 bg-dark-800/50 rounded-lg border border-dark-700/50">
                                                        <p className="text-sm text-dark-400">
                                                            <span className="font-semibold text-dark-300">Note:</span> {deposit.adminNote}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {deposit.cloudinaryUrl && (
                                            <a
                                                href={deposit.cloudinaryUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-4"
                                            >
                                                <img
                                                    src={deposit.cloudinaryUrl}
                                                    alt="Payment screenshot"
                                                    className="w-24 h-24 object-cover rounded-lg hover:scale-105 transition-transform"
                                                />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
