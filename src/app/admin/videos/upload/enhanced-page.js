/**
 * Enhanced Admin Video Upload Page
 * Complete upload form with all new fields
 * Supports both Cloudinary and S3 storage
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function EnhancedUploadPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: [],
        isPaid: false,
        price: 0,
        provider: 's3', // Default to S3
        videoUrl: '',
        thumbnailUrl: '',
        duration: 0,
        s3Key: '',
        s3Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ethioxhub',
        cloudinaryPublicId: '',
        cloudinaryUrl: '',
    });

    const [tagInput, setTagInput] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && formData.tags.length < 10) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    const handleVideoUpload = async (file) => {
        if (!file) return;

        setVideoFile(file);
        setUploadingVideo(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');

            if (formData.provider === 's3') {
                // S3 Upload
                const signResponse = await fetch(
                    `/api/upload/sign?provider=s3&file_name=${encodeURIComponent(file.name)}&file_type=${encodeURIComponent(file.type)}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }
                );

                if (!signResponse.ok) {
                    throw new Error('Failed to get S3 upload URL');
                }

                const signData = await signResponse.json();

                // Upload to S3
                const uploadResponse = await fetch(signData.uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload to S3');
                }

                setFormData(prev => ({
                    ...prev,
                    videoUrl: signData.fileUrl,
                    s3Key: signData.key,
                    s3Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ethioxhub',
                }));

            } else {
                // Cloudinary Upload
                const cloudinaryFormData = new FormData();
                cloudinaryFormData.append('file', file);
                cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ethioxhub_uploads');

                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                    {
                        method: 'POST',
                        body: cloudinaryFormData,
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload to Cloudinary');
                }

                const uploadData = await uploadResponse.json();

                setFormData(prev => ({
                    ...prev,
                    cloudinaryPublicId: uploadData.public_id,
                    cloudinaryUrl: uploadData.secure_url,
                    videoUrl: uploadData.secure_url,
                    duration: uploadData.duration || 0,
                }));
            }

            setUploadingVideo(false);

        } catch (err) {
            console.error('Video upload error:', err);
            setError(err.message);
            setUploadingVideo(false);
        }
    };

    const handleThumbnailUpload = async (file) => {
        if (!file) return;

        setThumbnailFile(file);
        setUploadingThumbnail(true);

        try {
            // Always upload thumbnails to Cloudinary for simplicity
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append('file', file);
            cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ethioxhub_uploads');
            cloudinaryFormData.append('folder', 'ethioxhub_thumbnails');

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: cloudinaryFormData,
                }
            );

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload thumbnail');
            }

            const uploadData = await uploadResponse.json();

            setFormData(prev => ({
                ...prev,
                thumbnailUrl: uploadData.secure_url,
            }));

            setUploadingThumbnail(false);

        } catch (err) {
            console.error('Thumbnail upload error:', err);
            alert('Failed to upload thumbnail');
            setUploadingThumbnail(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.category) {
            setError('Please fill in all required fields');
            return;
        }

        if (!formData.videoUrl) {
            setError('Please upload a video file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/admin/videos/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create video');
            }

            const data = await response.json();

            // Success
            alert('Video uploaded successfully!');
            router.push('/admin/videos');

        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
                    <p className="text-gray-400">Add a new video to the platform</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-8 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Storage Provider *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, provider: 's3' }))}
                                className={`px-4 py-3 rounded-lg font-medium transition-all ${formData.provider === 's3'
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                AWS S3
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, provider: 'cloudinary' }))}
                                className={`px-4 py-3 rounded-lg font-medium transition-all ${formData.provider === 'cloudinary'
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Cloudinary
                            </button>
                        </div>
                    </div>

                    {/* Video Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Video File *
                        </label>
                        <div className="flex items-center gap-4">
                            <label className={`flex-1 flex flex-col items-center px-4 py-6 bg-gray-800 text-gray-400 rounded-lg border-2 border-dashed ${uploadingVideo ? 'border-blue-500' : 'border-gray-700'} cursor-pointer hover:border-gray-600 transition-colors`}>
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-sm">
                                    {uploadingVideo ? 'Uploading...' : videoFile ? videoFile.name : 'Click to upload video'}
                                </span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleVideoUpload(e.target.files[0])}
                                    className="hidden"
                                    disabled={uploadingVideo}
                                />
                            </label>
                            {formData.videoUrl && (
                                <div className="text-green-500">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Thumbnail *
                        </label>
                        <div className="flex items-center gap-4">
                            <label className={`flex-1 flex flex-col items-center px-4 py-6 bg-gray-800 text-gray-400 rounded-lg border-2 border-dashed ${uploadingThumbnail ? 'border-blue-500' : 'border-gray-700'} cursor-pointer hover:border-gray-600 transition-colors`}>
                                {formData.thumbnailUrl ? (
                                    <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg mb-2" />
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm">
                                            {uploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}
                                        </span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleThumbnailUpload(e.target.files[0])}
                                    className="hidden"
                                    disabled={uploadingThumbnail}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter video title"
                            maxLength="200"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Enter video description"
                            rows="4"
                            maxLength="2000"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tags (Max 10)
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add tag and press Enter"
                                disabled={formData.tags.length >= 10}
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                disabled={formData.tags.length >= 10}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm flex items-center gap-2"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(index)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Paid/Free & Price */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isPaid"
                                    checked={formData.isPaid}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-300">Paid Video</span>
                            </label>
                        </div>

                        {formData.isPaid && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Price (ETB)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter price"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploadingVideo || uploadingThumbnail}
                            className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all ${loading || uploadingVideo || uploadingThumbnail
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {loading ? 'Uploading...' : 'Upload Video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
