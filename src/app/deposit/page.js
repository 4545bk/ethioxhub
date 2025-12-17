'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DepositPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const { t } = useLanguage();
    const [amount, setAmount] = useState('');
    const [senderName, setSenderName] = useState('');
    const [transactionCode, setTransactionCode] = useState('');
    const [phone, setPhone] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Redirect if not authenticated (client-side only)
    useEffect(() => {
        if (loading) return; // Wait for auth check
        if (!user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setUploading(true);

        try {
            // 1. Get upload signature
            const token = localStorage.getItem('accessToken');
            const signRes = await fetch('/api/upload/sign?purpose=deposit', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!signRes.ok) throw new Error('Failed to get upload signature');
            const uploadParams = await signRes.json(); // API returns params directly, not nested

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('signature', uploadParams.signature);
            formData.append('timestamp', uploadParams.timestamp);
            formData.append('api_key', uploadParams.apiKey);

            // Add only the signed parameters
            if (uploadParams.folder) formData.append('folder', uploadParams.folder);
            if (uploadParams.upload_preset) formData.append('upload_preset', uploadParams.upload_preset);
            if (uploadParams.allowed_formats) formData.append('allowed_formats', uploadParams.allowed_formats);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!uploadRes.ok) throw new Error('Failed to upload image');
            const uploadData = await uploadRes.json();

            // 3. Create deposit
            const depositRes = await fetch('/api/deposits/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(amount) * 100, // Convert to cents
                    senderName,
                    cloudinaryUrl: uploadData.secure_url,
                    cloudinaryId: uploadData.public_id,
                    metadata: {
                        transactionCode,
                        phone,
                    },
                }),
            });

            if (!depositRes.ok) {
                const errData = await depositRes.json();
                throw new Error(errData.error || 'Failed to create deposit');
            }

            setSuccess(true);
            setTimeout(() => router.push('/my-deposits'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-dark-950">
                <Navbar />
                <div className="pt-32 flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card max-w-md w-full text-center"
                    >
                        <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Deposit Submitted!</h2>
                        <p className="text-dark-400">
                            Your deposit request has been sent to admin for approval. You'll be credited soon.
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-bold text-white mb-2">{t('deposit')}</h1>
                        <p className="text-dark-400">Upload your payment screenshot to add funds to your account</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Form */}
                        <div className="lg:col-span-2 order-2 lg:order-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card"
                            >
                                {error && (
                                    <div className="mb-6 p-4 bg-error-500/10 border border-error-500/20 rounded-lg">
                                        <p className="text-sm text-error-400">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">{t('amountEtb')}</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="input"
                                            placeholder="100.00"
                                            min="1"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    {/* Payment Screenshot */}
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">{t('paymentScreenshot')}</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="screenshot"
                                                required
                                            />
                                            <label
                                                htmlFor="screenshot"
                                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-dark-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                                            >
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="h-full object-contain rounded-lg" />
                                                ) : (
                                                    <div className="text-center">
                                                        <svg className="w-12 h-12 mx-auto text-dark-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="text-dark-400 text-sm">{t('clickToUpload')}</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-dark-300 mb-2">{t('senderName')}</label>
                                            <input
                                                type="text"
                                                value={senderName}
                                                onChange={(e) => setSenderName(e.target.value)}
                                                className="input"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-dark-300 mb-2">{t('transactionCode')}</label>
                                            <input
                                                type="text"
                                                value={transactionCode}
                                                onChange={(e) => setTransactionCode(e.target.value)}
                                                className="input"
                                                placeholder="TX12345"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-2">{t('phoneNumber')}</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="input"
                                            placeholder="+251911234567"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={uploading || !imageFile}
                                        className="w-full btn btn-primary py-3 disabled:opacity-50"
                                    >
                                        {uploading ? t('processing') : t('submitDeposit')}
                                    </button>
                                </form>
                            </motion.div>
                        </div>

                        {/* Right Column: Bank Info */}
                        <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="card bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-700 pb-4">
                                    <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                    </svg>
                                    {t('bankAccounts')}
                                </h3>

                                <div className="space-y-6">
                                    {/* CBE */}
                                    <div className="bg-dark-950 p-4 rounded-xl border border-dark-700 hover:border-primary-500/50 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-bold text-purple-400">{t('cbe')}</div>
                                            <svg className="w-5 h-5 text-gray-600 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('commercialBank')}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-lg text-white select-all">100023456789</p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText('100023456789'); toast.success(t('copiedAccount')); }}
                                                className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-dark-800"
                                                title={t('copyAccount')}
                                                type="button"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Telebirr */}
                                    <div className="bg-dark-950 p-4 rounded-xl border border-dark-700 hover:border-green-500/50 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-bold text-green-400">{t('telebirr')}</div>
                                            <svg className="w-5 h-5 text-gray-600 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('mobileMoney')}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-lg text-white select-all">+251911223344</p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText('+251911223344'); toast.success(t('copiedPhone')); }}
                                                className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-dark-800"
                                                title={t('copyPhone')}
                                                type="button"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="bg-blue-900/10 border border-blue-500/20 text-blue-200 p-4 rounded-lg text-sm flex gap-3 items-start">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{t('ensureTransaction')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
