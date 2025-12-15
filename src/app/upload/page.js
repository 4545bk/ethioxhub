'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function UploadPage() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        router.push('/login');
        return null;
    }

    // Only admins can upload
    if (!user.roles?.includes('admin')) {
        return (
            <div className="min-h-screen bg-dark-950">
                <Navbar />
                <div className="pt-32 flex items-center justify-center px-4">
                    <div className="card max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-error-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                        <p className="text-dark-400 mb-4">Only administrators can upload videos.</p>
                        <button onClick={() => router.push('/')} className="btn btn-primary">
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <div className="pt-32 flex items-center justify-center px-4">
                <div className="card max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Admin Video Upload</h2>
                    <p className="text-dark-400">Upload feature coming soon. Use API directly for now.</p>
                </div>
            </div>
        </div>
    );
}
