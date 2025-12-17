'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuccessModal from '@/components/SuccessModal';

export default function UploadVideoPage() {
    const router = useRouter();
    const { user, refreshToken } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Entertainment',
        isPaid: false,
        price: '',
        provider: 'cloudinary', // 'cloudinary' or 's3'
    });

    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);

    const categories = ['Live records', 'Fuck', 'Naked', 'Unfiltered', 'Behind the scenes', 'habesha', 'secrets', 'Ethiopian'];

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (type === 'video') setVideoFile(file);
        else setThumbnailFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) return alert('Please select a video file');

        setUploading(true);
        setStatus('Initializing upload...');

        try {
            // Helper function to get fresh token
            const getValidToken = async () => {
                let token = localStorage.getItem('accessToken');

                // Try a quick check to see if token is valid
                const testRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!testRes.ok) {
                    // Token expired, refresh it
                    setStatus('Refreshing authentication...');
                    const refreshed = await refreshToken();
                    if (!refreshed) {
                        throw new Error('Session expired. Please log in again.');
                    }
                    token = localStorage.getItem('accessToken');
                }

                return token;
            };

            const token = await getValidToken();

            let videoData = {};

            if (formData.provider === 's3') {
                // AWS S3 Flow
                setStatus('Getting S3 signature...');
                const signRes = await fetch(`/api/upload/sign?provider=s3&file_name=${encodeURIComponent(videoFile.name)}&file_type=${encodeURIComponent(videoFile.type)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!signRes.ok) throw new Error('Failed to sign upload');
                const { uploadUrl, publicUrl, key, bucket } = await signRes.json();

                setStatus('Uploading to AWS S3...');
                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: videoFile,
                    headers: { 'Content-Type': videoFile.type }
                });

                if (!uploadRes.ok) throw new Error('S3 Upload Failed');

                videoData = {
                    provider: 's3',
                    s3Key: key,
                    s3Bucket: bucket || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ethioxhub',
                    videoUrl: publicUrl,
                    duration: 0
                };

            } else {
                // Cloudinary Flow
                setStatus('Uploading to Cloudinary...');
                const signVideoRes = await fetch('/api/upload/sign?resource_type=video', { headers: { Authorization: `Bearer ${token}` } });
                if (!signVideoRes.ok) throw new Error('Failed to get upload signature');
                const vParams = await signVideoRes.json();

                const vData = new FormData();
                vData.append('file', videoFile);
                vData.append('api_key', vParams.apiKey);
                vData.append('timestamp', vParams.timestamp);
                vData.append('signature', vParams.signature);
                if (vParams.folder) vData.append('folder', vParams.folder);

                const vUpload = await fetch(`https://api.cloudinary.com/v1_1/${vParams.cloudName}/video/upload`, {
                    method: 'POST', body: vData
                });
                if (!vUpload.ok) throw new Error('Video upload failed');
                const vResult = await vUpload.json();

                videoData = {
                    provider: 'cloudinary',
                    cloudinaryPublicId: vResult.public_id,
                    cloudinaryUrl: vResult.secure_url,
                    duration: vResult.duration
                };
            }

            // Thumbnail Upload
            let thumbUrl = '';
            if (thumbnailFile) {
                setStatus('Uploading thumbnail...');
                const signImgRes = await fetch('/api/upload/sign?resource_type=image', { headers: { Authorization: `Bearer ${token}` } });
                const iParams = await signImgRes.json();

                const iData = new FormData();
                iData.append('file', thumbnailFile);
                iData.append('api_key', iParams.apiKey);
                iData.append('timestamp', iParams.timestamp);
                iData.append('signature', iParams.signature);
                if (iParams.folder) iData.append('folder', iParams.folder);

                const iUpload = await fetch(`https://api.cloudinary.com/v1_1/${iParams.cloudName}/image/upload`, {
                    method: 'POST', body: iData
                });
                if (iUpload.ok) {
                    const iResult = await iUpload.json();
                    thumbUrl = iResult.secure_url;
                }
            } else if (videoData.provider === 'cloudinary') {
                thumbUrl = videoData.cloudinaryUrl.replace(/\.[^/.]+$/, ".jpg");
            }

            // 3. Create Video Entry in DB
            setStatus('Saving details...');
            let res = await fetch('/api/admin/videos/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: formData.isPaid ? parseFloat(formData.price) : 0,
                    thumbnailUrl: thumbUrl,
                    ...videoData
                })
            });

            // If 401, refresh token and retry once
            if (res.status === 401) {
                setStatus('Refreshing session and retrying...');
                const refreshed = await refreshToken();
                if (!refreshed) {
                    throw new Error('Session expired. Please log in again.');
                }

                const newToken = localStorage.getItem('accessToken');
                res = await fetch('/api/admin/videos/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${newToken}`
                    },
                    body: JSON.stringify({
                        ...formData,
                        price: formData.isPaid ? parseFloat(formData.price) : 0,
                        thumbnailUrl: thumbUrl,
                        ...videoData
                    })
                });
            }

            if (res.ok) {
                setUploading(false); // Clear uploading state
                setStatus(''); // Clear status
                setShowSuccess(true); // Show Success Modal
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save video');
            }

        } catch (err) {
            console.error('Upload error:', err);
            let msg = err.message || 'Upload failed';
            if (msg.includes('Failed to fetch') && formData.provider === 's3') {
                msg += ' (Possible CORS issue. Check S3 bucket permissions)';
            }
            alert('Error: ' + msg);
            setUploading(false);
            setStatus('');
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
                        <h1 className="text-2xl font-bold text-gray-800">Upload Video</h1>
                        <div className="text-sm text-gray-500 breadcrumbs">
                            <span>Admin</span> <span className="mx-1">/</span> <span className="text-blue-600">Upload</span>
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
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">

                            {/* Section: Provider */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Storage Provider</label>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.provider === 'cloudinary' ? 'border-blue-600' : 'border-gray-400'}`}>
                                            {formData.provider === 'cloudinary' && <div className="w-3 h-3 rounded-full bg-blue-600"></div>}
                                        </div>
                                        <input
                                            type="radio"
                                            name="provider"
                                            value="cloudinary"
                                            checked={formData.provider === 'cloudinary'}
                                            onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                            className="hidden"
                                        />
                                        <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">Cloudinary (Default)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.provider === 's3' ? 'border-blue-600' : 'border-gray-400'}`}>
                                            {formData.provider === 's3' && <div className="w-3 h-3 rounded-full bg-blue-600"></div>}
                                        </div>
                                        <input
                                            type="radio"
                                            name="provider"
                                            value="s3"
                                            checked={formData.provider === 's3'}
                                            onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                            className="hidden"
                                        />
                                        <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">AWS S3</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Title */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter video title"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Paid Toggle */}
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${formData.isPaid ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.isPaid ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.isPaid}
                                            onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                                        />
                                        <span className="text-gray-700 font-medium">Premium (Paid) Video</span>
                                    </label>
                                </div>

                                {/* Description */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 h-32 resize-y"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What is this video about?"
                                    />
                                </div>

                                {/* Price */}
                                {formData.isPaid && (
                                    <div className="col-span-2 md:col-span-1 animate-fadeIn">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (ETB)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">ETB</span>
                                            <input
                                                type="number"
                                                required={formData.isPaid}
                                                className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                                                placeholder="50.00"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File Upload Area */}
                            <div className="border-t border-gray-100 pt-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Media Files</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Video Input */}
                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${videoFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                        <div className="mb-2 text-blue-500">
                                            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </div>
                                        <label className="block cursor-pointer">
                                            <span className="font-semibold text-gray-700">{videoFile ? videoFile.name : 'Select Video File'}</span>
                                            <input type="file" accept="video/*" onChange={e => handleFileChange(e, 'video')} className="hidden" required />
                                            {!videoFile && <p className="text-xs text-gray-500 mt-1">MP4, WebM, or Ogg</p>}
                                        </label>
                                    </div>

                                    {/* Thumbnail Input */}
                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${thumbnailFile ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                        <div className="mb-2 text-purple-500">
                                            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <label className="block cursor-pointer">
                                            <span className="font-semibold text-gray-700">{thumbnailFile ? thumbnailFile.name : 'Select Thumbnail'}</span>
                                            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image')} className="hidden" />
                                            {!thumbnailFile && <p className="text-xs text-gray-500 mt-1">JPG or PNG (Optional)</p>}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'
                                        }`}
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                            {status}
                                        </span>
                                    ) : 'Upload Video Now'}
                                </button>
                            </div>
                        </form>

                        {/* Success Modal Instance */}
                        <SuccessModal
                            isOpen={showSuccess}
                            onClose={() => router.push('/admin')}
                            message="Video Uploaded Successfully!"
                            subMessage="Your video has been securely uploaded and sent for final processing."
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
