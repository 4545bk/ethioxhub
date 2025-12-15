'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminProfilePage() {
    const { user, refreshUser } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [currentPic, setCurrentPic] = useState('');

    useEffect(() => {
        if (user) {
            setCurrentPic(user.profilePicture || '');
        }
    }, [user]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('accessToken');

            // 1. Get Signature
            const signRes = await fetch('/api/upload/sign?resource_type=image', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!signRes.ok) {
                if (signRes.status === 401) throw new Error('Session expired');
                throw new Error('Failed to get signature');
            }

            const params = await signRes.json();

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', params.apiKey);
            formData.append('timestamp', params.timestamp);
            formData.append('signature', params.signature);
            formData.append('folder', params.folder || 'ethioxhub_avatars');

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const result = await uploadRes.json();
            const imageUrl = result.secure_url;

            // 3. Save to User Profile
            const updateRes = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ profilePicture: imageUrl })
            });

            if (updateRes.ok) {
                alert('Profile picture updated successfully!');
                await refreshUser(); // Update info without reload
                setFile(null);
                setPreview('');
            } else {
                throw new Error('Failed to update profile');
            }

        } catch (err) {
            console.error(err);
            alert('Error updating profile: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
            {/* Admin Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
                        <div className="text-sm text-gray-500 breadcrumbs">
                            <span>Admin</span> <span className="mx-1">/</span> <span className="text-blue-600">Profile</span>
                        </div>
                    </div>
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="font-bold text-gray-900">{user.username}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">{user.username[0]}</div>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Cover-like banner */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                            <div className="px-8 pb-8">
                                <div className="relative flex justify-between items-end -mt-12 mb-6">
                                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative group">
                                        {preview || currentPic ? (
                                            <img
                                                src={preview || currentPic}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-4xl font-bold">
                                                {user?.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {/* Overlay instruction */}
                                        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
                                        <p className="text-gray-500 text-sm">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Account Details</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-gray-500 mb-1">Role</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold uppercase">{user?.roles?.join(', ')}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 mb-1">Status</span>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold uppercase">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Update Profile Picture</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-gray-500 text-center text-sm font-medium bg-white">
                                                    Choose File...
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            {file && (
                                                <button
                                                    onClick={handleUpload}
                                                    disabled={uploading}
                                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                                                >
                                                    {uploading ? 'Uploading...' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                        {file && <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
