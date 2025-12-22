'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

import { useToast } from '@/contexts/ToastContext';

export default function DepositDetailPage({ params }) {
    const { user } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const { id } = params;
    const [deposit, setDeposit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            // router.push('/login'); // Let AuthContext handle this usually, or explicit check
            return;
        }
        if (user && !user.roles.includes('admin')) {
            router.push('/');
            return;
        }
        fetchDeposit();
    }, [user, id]);

    const fetchDeposit = async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`/api/admin/deposits/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDeposit(data.deposit);
            } else {
                setError('Failed to load deposit');
            }
        } catch (err) {
            setError('Error loading deposit');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this deposit?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch('/api/admin/deposits/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ txId: id, token: 'manual-admin-action' }),
            });

            if (res.ok) {
                toast.success('Approved successfully ✅');
                fetchDeposit(); // Refresh
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to approve');
            }
        } catch (err) {
            toast.error('Error processing request');
        }
    };

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch('/api/admin/deposits/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ txId: id, adminNote: reason, token: 'manual-admin-action' }),
            });

            if (res.ok) {
                toast.success('Rejected successfully ❌');
                fetchDeposit(); // Refresh
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to reject');
            }
        } catch (err) {
            toast.error('Error processing request');
        }
    };

    if (loading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Loading...</div>;
    if (error) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-error-500">{error}</div>;
    if (!deposit) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Deposit not found</div>;

    const senderName = deposit.senderName || deposit.metadata?.senderName || 'Unknown';

    return (
        <div className="min-h-screen bg-dark-950 text-white">
            <div className="container mx-auto px-4 py-8">
                <Link href="/admin" className="text-primary-400 hover:text-primary-300 mb-6 inline-block">
                    &larr; Back to Dashboard
                </Link>

                <div className="card max-w-4xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-bold">Deposit Details</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${deposit.status === 'approved' ? 'bg-success-500/20 text-success-400' :
                            deposit.status === 'rejected' ? 'bg-error-500/20 text-error-400' :
                                'bg-warning-500/20 text-warning-400'
                            }`}>
                            {deposit.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-dark-300">Transaction Info</h2>
                            <div className="space-y-3">
                                <DetailRow label="Transaction ID" value={deposit.id} />
                                <DetailRow label="Amount" value={`${deposit.displayAmount} ETB`} allowCopy />
                                <DetailRow label="Date" value={new Date(deposit.createdAt).toLocaleString()} />
                                <DetailRow label="Status" value={deposit.status} />
                                {deposit.adminNote && <DetailRow label="Admin Note" value={deposit.adminNote} />}
                            </div>

                            <h2 className="text-lg font-semibold mt-8 mb-4 text-dark-300">Sender Info</h2>
                            <div className="space-y-3">
                                <DetailRow label="User" value={`${deposit.user?.username} (${deposit.user?.email})`} />
                                <DetailRow label="Sender Name" value={senderName} allowCopy />
                                {deposit.metadata?.phone && <DetailRow label="Phone" value={deposit.metadata.phone} allowCopy />}
                                {deposit.metadata?.transactionCode && <DetailRow label="Transaction Code" value={deposit.metadata.transactionCode} allowCopy />}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-dark-300">Proof of Payment</h2>
                            {deposit.cloudinaryUrl ? (
                                <a href={deposit.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={deposit.cloudinaryUrl}
                                        alt="Proof"
                                        className="w-full rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                                    />
                                </a>
                            ) : (
                                <div className="h-48 bg-dark-800 rounded-lg flex items-center justify-center text-dark-500">
                                    No Image Provided
                                </div>
                            )}
                        </div>
                    </div>

                    {deposit.status === 'pending' && (
                        <div className="mt-8 pt-6 border-t border-dark-800 flex justify-end space-x-4">
                            <button
                                onClick={handleReject}
                                className="px-6 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-6 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Approve
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, allowCopy }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-dark-800/50">
            <span className="text-dark-400">{label}</span>
            <div className="flex items-center space-x-2">
                <span className="text-dark-100 font-mono text-sm">{value}</span>
                {allowCopy && (
                    <button
                        onClick={() => navigator.clipboard.writeText(value)}
                        className="text-dark-500 hover:text-primary-400 transition-colors"
                        title="Copy"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
