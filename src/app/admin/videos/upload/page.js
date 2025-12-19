'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuccessModal from '@/components/SuccessModal';
import axios from 'axios';

export default function UploadVideoPage() {
    const router = useRouter();
    const { user, refreshToken } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'batch'

    // Single upload states
    const [singleVideoFile, setSingleVideoFile] = useState(null);
    const [singleThumbnailFile, setSingleThumbnailFile] = useState(null);
    const [singleUploadProgress, setSingleUploadProgress] = useState(0);
    const [singleStatus, setSingleStatus] = useState('');

    // Batch upload states
    const [videoFiles, setVideoFiles] = useState([]);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [completedUploads, setCompletedUploads] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Entertainment',
        isPaid: false,
        price: '',
        provider: 'cloudinary',
    });

    const [batchThumbnailFile, setBatchThumbnailFile] = useState(null);

    const categories = ['Live records', 'Fuck', 'Naked', 'Unfiltered', 'Behind the scenes', 'habesha', 'secrets', 'Ethiopian'];

    // Generate thumbnail from video
    const generateThumbnailFromVideo = (videoFile) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                // Seek to 1 second or 10% of video duration
                const seekTime = Math.min(1, video.duration * 0.1);
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                try {
                    // Set canvas dimensions to video dimensions
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // Draw the video frame
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Convert canvas to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            // Create a File object from the blob
                            const thumbnailFile = new File([blob], `${videoFile.name.replace(/\.[^/.]+$/, '')}-thumb.jpg`, {
                                type: 'image/jpeg',
                            });
                            window.URL.revokeObjectURL(video.src);
                            resolve(thumbnailFile);
                        } else {
                            window.URL.revokeObjectURL(video.src);
                            reject(new Error('Failed to create thumbnail blob'));
                        }
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    window.URL.revokeObjectURL(video.src);
                    reject(error);
                }
            };

            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video'));
            };

            video.src = URL.createObjectURL(videoFile);
        });
    };

    // Handle single video file
    const handleSingleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSingleVideoFile(file);
        }
    };

    const handleSingleThumbnailChange = (e) => {
        setSingleThumbnailFile(e.target.files[0]);
    };

    // Handle multiple video files
    const handleVideoFilesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newQueue = files.map((file, index) => ({
                id: Date.now() + index,
                file,
                status: 'pending',
                progress: 0,
                message: '',
                title: file.name.replace(/\.[^/.]+$/, ''),
            }));
            setVideoFiles(files);
            setUploadQueue(newQueue);
        }
    };

    const handleBatchThumbnailChange = (e) => {
        setBatchThumbnailFile(e.target.files[0]);
    };

    // Get video duration
    const getVideoDuration = (file) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };

            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video metadata'));
            };

            video.src = URL.createObjectURL(file);
        });
    };

    // Single video upload submit
    const handleSingleSubmit = async (e) => {
        e.preventDefault();
        if (!singleVideoFile) return alert('Please select a video file');

        setUploading(true);
        setSingleStatus('Initializing upload...');

        try {
            const getValidToken = async () => {
                let token = localStorage.getItem('accessToken');
                const testRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!testRes.ok) {
                    setSingleStatus('Refreshing authentication...');
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
                setSingleStatus('Extracting video metadata...');
                let videoDuration = 0;
                try {
                    videoDuration = await getVideoDuration(singleVideoFile);
                } catch (error) {
                    console.warn('Could not extract duration:', error.message);
                }

                setSingleStatus('Getting S3 signature...');
                const signRes = await fetch(`/api/upload/sign?provider=s3&file_name=${encodeURIComponent(singleVideoFile.name)}&file_type=${encodeURIComponent(singleVideoFile.type)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!signRes.ok) throw new Error('Failed to sign upload');
                const { uploadUrl, publicUrl, key, bucket } = await signRes.json();

                setSingleStatus('Uploading to AWS S3...');
                await axios.put(uploadUrl, singleVideoFile, {
                    headers: { 'Content-Type': singleVideoFile.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setSingleUploadProgress(percentCompleted);
                        setSingleStatus(`Uploading to S3... ${percentCompleted}%`);
                    }
                });

                videoData = {
                    provider: 's3',
                    s3Key: key,
                    s3Bucket: bucket || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ethioxhub',
                    videoUrl: publicUrl,
                    duration: videoDuration
                };

            } else {
                setSingleStatus('Uploading to Cloudinary...');
                const signVideoRes = await fetch('/api/upload/sign?resource_type=video', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!signVideoRes.ok) throw new Error('Failed to get upload signature');
                const vParams = await signVideoRes.json();

                const vData = new FormData();
                vData.append('file', singleVideoFile);
                vData.append('api_key', vParams.apiKey);
                vData.append('timestamp', vParams.timestamp);
                vData.append('signature', vParams.signature);
                if (vParams.folder) vData.append('folder', vParams.folder);

                const vUpload = await axios.post(
                    `https://api.cloudinary.com/v1_1/${vParams.cloudName}/video/upload`,
                    vData,
                    {
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setSingleUploadProgress(percentCompleted);
                            setSingleStatus(`Uploading... ${percentCompleted}%`);
                        }
                    }
                );
                const vResult = vUpload.data;

                videoData = {
                    provider: 'cloudinary',
                    cloudinaryPublicId: vResult.public_id,
                    cloudinaryUrl: vResult.secure_url,
                    duration: vResult.duration
                };
            }

            // Thumbnail handling - auto-generate if not provided
            let thumbUrl = '';
            let thumbnailToUpload = singleThumbnailFile;

            if (!thumbnailToUpload) {
                try {
                    setSingleStatus('Generating thumbnail from video...');
                    thumbnailToUpload = await generateThumbnailFromVideo(singleVideoFile);
                } catch (error) {
                    console.warn('Failed to generate thumbnail:', error);
                }
            }

            if (thumbnailToUpload) {
                setSingleStatus('Uploading thumbnail...');
                const signImgRes = await fetch('/api/upload/sign?resource_type=image', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const iParams = await signImgRes.json();

                const iData = new FormData();
                iData.append('file', thumbnailToUpload);
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

            setSingleStatus('Saving details...');
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

            if (res.status === 401) {
                setSingleStatus('Refreshing session and retrying...');
                const refreshed = await refreshToken();
                if (!refreshed) throw new Error('Session expired. Please log in again.');

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
                setUploading(false);
                setSingleStatus('');
                setShowSuccess(true);
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
            setSingleStatus('');
        }
    };

    // Upload a single video from batch
    const uploadSingleVideo = async (queueItem, index) => {
        const videoFile = queueItem.file;

        setUploadQueue(prev => prev.map((item, i) =>
            i === index ? { ...item, status: 'uploading', message: 'Initializing...' } : item
        ));

        try {
            const getValidToken = async () => {
                let token = localStorage.getItem('accessToken');
                const testRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!testRes.ok) {
                    const refreshed = await refreshToken();
                    if (!refreshed) throw new Error('Session expired. Please log in again.');
                    token = localStorage.getItem('accessToken');
                }
                return token;
            };

            const token = await getValidToken();
            let videoData = {};

            if (formData.provider === 's3') {
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, message: 'Extracting metadata...' } : item
                ));

                let videoDuration = 0;
                try {
                    videoDuration = await getVideoDuration(videoFile);
                } catch (error) {
                    console.warn('Could not extract duration:', error.message);
                }

                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, message: 'Getting S3 signature...' } : item
                ));

                const signRes = await fetch(`/api/upload/sign?provider=s3&file_name=${encodeURIComponent(videoFile.name)}&file_type=${encodeURIComponent(videoFile.type)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!signRes.ok) throw new Error('Failed to sign upload');
                const { uploadUrl, publicUrl, key, bucket } = await signRes.json();

                await axios.put(uploadUrl, videoFile, {
                    headers: { 'Content-Type': videoFile.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadQueue(prev => prev.map((item, i) =>
                            i === index ? {
                                ...item,
                                progress: percentCompleted,
                                message: `Uploading to S3... ${percentCompleted}%`
                            } : item
                        ));
                    }
                });

                videoData = {
                    provider: 's3',
                    s3Key: key,
                    s3Bucket: bucket || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ethioxhub',
                    videoUrl: publicUrl,
                    duration: videoDuration
                };

            } else {
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, message: 'Uploading to Cloudinary...' } : item
                ));

                const signVideoRes = await fetch('/api/upload/sign?resource_type=video', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!signVideoRes.ok) throw new Error('Failed to get upload signature');
                const vParams = await signVideoRes.json();

                const vData = new FormData();
                vData.append('file', videoFile);
                vData.append('api_key', vParams.apiKey);
                vData.append('timestamp', vParams.timestamp);
                vData.append('signature', vParams.signature);
                if (vParams.folder) vData.append('folder', vParams.folder);

                const vUpload = await axios.post(
                    `https://api.cloudinary.com/v1_1/${vParams.cloudName}/video/upload`,
                    vData,
                    {
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadQueue(prev => prev.map((item, i) =>
                                i === index ? {
                                    ...item,
                                    progress: percentCompleted,
                                    message: `Uploading... ${percentCompleted}%`
                                } : item
                            ));
                        }
                    }
                );
                const vResult = vUpload.data;

                videoData = {
                    provider: 'cloudinary',
                    cloudinaryPublicId: vResult.public_id,
                    cloudinaryUrl: vResult.secure_url,
                    duration: vResult.duration
                };
            }

            // Thumbnail - auto-generate if not provided
            let thumbUrl = '';
            let thumbnailToUpload = batchThumbnailFile;

            if (!thumbnailToUpload) {
                try {
                    setUploadQueue(prev => prev.map((item, i) =>
                        i === index ? { ...item, message: 'Generating thumbnail...' } : item
                    ));
                    thumbnailToUpload = await generateThumbnailFromVideo(videoFile);
                } catch (error) {
                    console.warn('Failed to generate thumbnail:', error);
                }
            }

            if (thumbnailToUpload) {
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, message: 'Uploading thumbnail...' } : item
                ));

                const signImgRes = await fetch('/api/upload/sign?resource_type=image', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const iParams = await signImgRes.json();

                const iData = new FormData();
                iData.append('file', thumbnailToUpload);
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

            setUploadQueue(prev => prev.map((item, i) =>
                i === index ? { ...item, message: 'Saving to database...' } : item
            ));

            let res = await fetch('/api/admin/videos/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: queueItem.title,
                    description: formData.description,
                    category: formData.category,
                    isPaid: formData.isPaid,
                    price: formData.isPaid ? parseFloat(formData.price) : 0,
                    thumbnailUrl: thumbUrl,
                    ...videoData
                })
            });

            if (res.status === 401) {
                const refreshed = await refreshToken();
                if (!refreshed) throw new Error('Session expired');

                const newToken = localStorage.getItem('accessToken');
                res = await fetch('/api/admin/videos/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${newToken}`
                    },
                    body: JSON.stringify({
                        title: queueItem.title,
                        description: formData.description,
                        category: formData.category,
                        isPaid: formData.isPaid,
                        price: formData.isPaid ? parseFloat(formData.price) : 0,
                        thumbnailUrl: thumbUrl,
                        ...videoData
                    })
                });
            }

            if (res.ok) {
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? {
                        ...item,
                        status: 'success',
                        progress: 100,
                        message: 'Upload successful!'
                    } : item
                ));
                setCompletedUploads(prev => [...prev, queueItem.id]);
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save video');
            }

        } catch (err) {
            console.error('Upload error:', err);
            let msg = err.message || 'Upload failed';
            if (msg.includes('Failed to fetch') && formData.provider === 's3') {
                msg += ' (Possible CORS issue)';
            }

            setUploadQueue(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    status: 'error',
                    message: msg
                } : item
            ));
        }
    };

    // Batch upload submit
    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        if (videoFiles.length === 0) return alert('Please select at least one video file');

        setUploading(true);

        for (let i = 0; i < uploadQueue.length; i++) {
            await uploadSingleVideo(uploadQueue[i], i);
        }

        setUploading(false);
        setShowSuccess(true);
    };

    const updateVideoTitle = (index, newTitle) => {
        setUploadQueue(prev => prev.map((item, i) =>
            i === index ? { ...item, title: newTitle } : item
        ));
    };

    const removeFromQueue = (index) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== index));
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Upload Videos</h1>
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
                                    <img src={user.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">{user.username[0]}</div>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        {/* Upload Mode Toggle */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setUploadMode('single')}
                                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${uploadMode === 'single'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" /></svg>
                                        Single Upload
                                    </div>
                                </button>
                                <button
                                    onClick={() => setUploadMode('batch')}
                                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${uploadMode === 'batch'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                                        Batch Upload
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Single Upload Form */}
                        {uploadMode === 'single' && (
                            <form onSubmit={handleSingleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
                                {/* Provider */}
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
                                            <span className="text-gray-900 font-medium">Cloudinary (Default)</span>
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
                                            <span className="text-gray-900 font-medium">AWS S3</span>
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
                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${singleVideoFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                            <div className="mb-2 text-blue-500">
                                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </div>
                                            <label className="block cursor-pointer">
                                                <span className="font-semibold text-gray-700">{singleVideoFile ? singleVideoFile.name : 'Select Video File'}</span>
                                                <input type="file" accept="video/*" onChange={handleSingleVideoChange} className="hidden" required />
                                                {!singleVideoFile && <p className="text-xs text-gray-500 mt-1">MP4, WebM, or Ogg</p>}
                                            </label>
                                        </div>

                                        {/* Thumbnail Input */}
                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${singleThumbnailFile ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                            <div className="mb-2 text-purple-500">
                                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <label className="block cursor-pointer">
                                                <span className="font-semibold text-gray-700">{singleThumbnailFile ? singleThumbnailFile.name : 'Select Thumbnail (Optional)'}</span>
                                                <input type="file" accept="image/*" onChange={handleSingleThumbnailChange} className="hidden" />
                                                {!singleThumbnailFile && <p className="text-xs text-gray-500 mt-1">Auto-generated if not provided</p>}
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
                                            <div className="flex items-center justify-center gap-3">
                                                <CircularProgress progress={singleUploadProgress} size={32} />
                                                <span className="text-lg font-medium">{singleStatus}</span>
                                            </div>
                                        ) : 'Upload Video Now'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Batch Upload Form */}
                        {uploadMode === 'batch' && (
                            <form onSubmit={handleBatchSubmit} className="space-y-6">
                                {/* Common Settings */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
                                    <h2 className="text-xl font-bold text-gray-800 border-b pb-3">Common Settings (Applied to All Videos)</h2>

                                    {/* Provider */}
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
                                                <span className="text-gray-900 font-medium">Cloudinary (Default)</span>
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
                                                <span className="text-gray-900 font-medium">AWS S3</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <span className="text-gray-700 font-medium">Premium (Paid) Videos</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Common)</label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 h-24 resize-y"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Description for all videos (optional)"
                                        />
                                    </div>

                                    {/* Price */}
                                    {formData.isPaid && (
                                        <div className="animate-fadeIn">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (ETB) - Applied to All</label>
                                            <div className="relative max-w-xs">
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

                                    {/* Common Thumbnail */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Common Thumbnail (Optional)</label>
                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors max-w-md ${batchThumbnailFile ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                            <div className="mb-2 text-purple-500">
                                                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <label className="block cursor-pointer">
                                                <span className="font-semibold text-gray-700">{batchThumbnailFile ? batchThumbnailFile.name : 'Select Thumbnail'}</span>
                                                <input type="file" accept="image/*" onChange={handleBatchThumbnailChange} className="hidden" />
                                                {!batchThumbnailFile && <p className="text-xs text-gray-500 mt-1">Auto-generated if not provided</p>}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Selection */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Select Videos</h2>
                                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${videoFiles.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                        <div className="mb-3 text-blue-500">
                                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </div>
                                        <label className="block cursor-pointer">
                                            <span className="font-bold text-lg text-gray-700">
                                                {videoFiles.length > 0 ? `${videoFiles.length} video(s) selected` : 'Click to select multiple videos'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                multiple
                                                onChange={handleVideoFilesChange}
                                                className="hidden"
                                                required={videoFiles.length === 0}
                                            />
                                            <p className="text-sm text-gray-500 mt-2">MP4, WebM, or Ogg - Select multiple files</p>
                                        </label>
                                    </div>
                                </div>

                                {/* Upload Queue */}
                                {uploadQueue.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                                        <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Queue ({uploadQueue.length} videos)</h2>
                                        <div className="space-y-4">
                                            {uploadQueue.map((item, index) => (
                                                <div key={item.id} className={`border rounded-lg p-4 ${item.status === 'success' ? 'bg-green-50 border-green-200' :
                                                        item.status === 'error' ? 'bg-red-50 border-red-200' :
                                                            item.status === 'uploading' ? 'bg-blue-50 border-blue-200' :
                                                                'bg-gray-50 border-gray-200'
                                                    }`}>
                                                    <div className="flex items-start gap-4">
                                                        {/* Status Icon */}
                                                        <div className="flex-shrink-0 mt-1">
                                                            {item.status === 'success' && (
                                                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                            )}
                                                            {item.status === 'error' && (
                                                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                            )}
                                                            {item.status === 'uploading' && (
                                                                <CircularProgress progress={item.progress} size={24} />
                                                            )}
                                                            {item.status === 'pending' && (
                                                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {item.status === 'pending' ? (
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                                                    value={item.title}
                                                                    onChange={(e) => updateVideoTitle(index, e.target.value)}
                                                                    placeholder="Video title"
                                                                />
                                                            ) : (
                                                                <p className="font-semibold text-gray-800">{item.title}</p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1">{item.file.name} • {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                            {item.message && (
                                                                <p className={`text-sm mt-1 ${item.status === 'error' ? 'text-red-600' :
                                                                        item.status === 'success' ? 'text-green-600' :
                                                                            'text-blue-600'
                                                                    }`}>
                                                                    {item.message}
                                                                </p>
                                                            )}
                                                            {item.status === 'uploading' && item.progress > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${item.progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Remove Button */}
                                                        {item.status === 'pending' && !uploading && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromQueue(index)}
                                                                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                {uploadQueue.length > 0 && (
                                    <div>
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'
                                                }`}
                                        >
                                            {uploading ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <CircularProgress progress={50} size={32} />
                                                    <span>Uploading {completedUploads.length}/{uploadQueue.length} videos...</span>
                                                </div>
                                            ) : `Upload ${uploadQueue.length} Video${uploadQueue.length > 1 ? 's' : ''} Now`}
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}

                        {/* Success Modal */}
                        <SuccessModal
                            isOpen={showSuccess}
                            onClose={() => router.push('/admin')}
                            message={uploadMode === 'single' ? 'Video Uploaded Successfully!' : `${completedUploads.length} Video${completedUploads.length > 1 ? 's' : ''} Uploaded Successfully!`}
                            subMessage={uploadMode === 'single' ? 'Your video has been securely uploaded and sent for final processing.' : 'Your videos have been securely uploaded and sent for final processing.'}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

const CircularProgress = ({ progress, size = 32, strokeWidth = 3 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-white opacity-20"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-white transition-all duration-200 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                    {Math.round(progress)}
                </span>
            </div>
        </div>
    );
};
