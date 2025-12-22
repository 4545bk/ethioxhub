'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import AdminSidebar from '@/components/AdminSidebar';
import PhotosManager from '@/components/admin/PhotosManager';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('deposits');
    const [deposits, setDeposits] = useState([]);
    const [videos, setVideos] = useState([]);
    const [users, setUsers] = useState([]); // Added users state
    const [allVideos, setAllVideos] = useState([]); // For "All Videos" tab
    const [analytics, setAnalytics] = useState({
        totalUsers: 0,
        newUsers: 0,
        totalViews: 0,
        totalRevenue: 0,
        pendingDeposits: 0,
        pendingVideos: 0,
        totalVideos: 0,
        activeUsers: 0
    });
    const [loading, setLoading] = useState(true);
    // Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedDepositId, setSelectedDepositId] = useState(null);
    // Delete video modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [selectedVideoTitle, setSelectedVideoTitle] = useState('');
    // Edit video modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        isPaid: false,
        price: 0
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Number of videos per page

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        // Wait for auth to finish loading before redirecting
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        if (!user.roles.includes('admin') || user.email !== 'abebe@gmail.com') {
            router.push('/');
            return;
        }
        fetchData();
        fetchAnalytics();
        fetchCategories();
    }, [user, authLoading, activeTab]);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setAnalytics(data.analytics);
                }
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');

        try {
            if (activeTab === 'deposits') {
                const res = await fetch('/api/admin/deposits/pending', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setDeposits(data.deposits || []);
                }
            } else if (activeTab === 'users') {
                const res = await fetch('/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } else if (activeTab === 'allVideos') {
                // Fetch all videos (not just pending)
                const res = await fetch('/api/videos?limit=100&status=approved', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllVideos(data.videos || []);
                }
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveDeposit = async (txId) => {
        const token = localStorage.getItem('accessToken');
        const adminToken = 'manual-admin-action';

        try {
            const res = await fetch('/api/admin/deposits/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ txId, token: adminToken }),
            });

            if (res.ok) {
                fetchData();
                fetchAnalytics();
                toast.success('Deposit approved successfully! ✅');
                fetchDeposits();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to approve');
            }
        } catch (error) {
            console.error('Approve error:', error);
            toast.error('Failed to approve deposit');
        }
    };

    const handleRejectDeposit = (txId) => {
        setSelectedDepositId(txId);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedDepositId || !rejectReason.trim()) return;

        const token = localStorage.getItem('accessToken');
        const adminToken = 'manual-admin-action';

        try {
            const res = await fetch('/api/admin/deposits/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ txId: selectedDepositId, adminNote: rejectReason, token: adminToken }),
            });

            if (res.ok) {
                fetchData();
                fetchAnalytics();
                setIsRejectModalOpen(false);
                toast.success('Deposit rejected ❌');
                fetchDeposits();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to reject');
            }
        } catch (error) {
            console.error('Reject error:', error);
            toast.error('Failed to reject deposit');
        }
    };

    const handleApproveVideo = async (videoId) => {
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/admin/videos/${videoId}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchData();
                fetchAnalytics();
                toast.success('Video approved! ✅');
                fetchVideos();
            } else {
                toast.error('Failed to approve video');
            }
        } catch (err) {
            toast.error('Failed to approve video');
        }
    };

    const handleRejectVideo = async (videoId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/admin/videos/${videoId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (res.ok) {
                fetchData();
                fetchAnalytics();
                toast.success('Video rejected ❌');
                fetchVideos();
            } else {
                toast.error('Failed to reject video');
            }
        } catch (err) {
            toast.error('Failed to reject video');
        }
    };

    const handleDeleteVideo = (videoId, videoTitle) => {
        setSelectedVideoId(videoId);
        setSelectedVideoTitle(videoTitle);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteVideo = async () => {
        if (!selectedVideoId) return;

        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/admin/videos/${selectedVideoId}/delete`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                setSelectedVideoId(null);
                setSelectedVideoTitle('');
                toast.success('Video deleted successfully! 🗑️');
                // Refresh the current data
                fetchData();
                fetchAnalytics();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to delete video');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete video');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('User deleted successfully');
                fetchData();
                fetchAnalytics();
            } else {
                toast.error('Failed to delete user');
            }
        } catch (err) {
            toast.error('Error deleting user');
        }
    };

    const handleEditVideo = (video) => {
        setEditingVideo(video);
        setEditForm({
            title: video.title || '',
            description: video.description || '',
            category: video.category?._id || video.category || '',
            tags: video.tags ? video.tags.join(', ') : '',
            isPaid: video.isPaid || false,
            price: video.price ? (video.price / 100).toFixed(2) : '0'
        });
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const confirmEditVideo = async () => {
        if (!editingVideo || !editForm.title.trim()) {
            toast.error('Title is required');
            return;
        }

        const token = localStorage.getItem('accessToken');
        let thumbnailUrl = editingVideo.thumbnailUrl; // Keep existing by default

        try {
            // Upload new thumbnail if changed
            if (thumbnailFile) {
                // Get upload signature
                const signRes = await fetch('/api/upload/sign?purpose=thumbnail', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!signRes.ok) throw new Error('Failed to get upload signature');
                const uploadParams = await signRes.json();

                // Upload to Cloudinary
                const formData = new FormData();
                formData.append('file', thumbnailFile);
                formData.append('signature', uploadParams.signature);
                formData.append('timestamp', uploadParams.timestamp);
                formData.append('api_key', uploadParams.apiKey);
                if (uploadParams.folder) formData.append('folder', uploadParams.folder);

                const uploadRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
                    { method: 'POST', body: formData }
                );
                if (!uploadRes.ok) throw new Error('Failed to upload thumbnail');
                const uploadData = await uploadRes.json();
                thumbnailUrl = uploadData.secure_url;
            }

            // Update video with new data
            const res = await fetch(`/api/admin/videos/${editingVideo._id}/edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: editForm.title.trim(),
                    description: editForm.description.trim(),
                    category: editForm.category || null,
                    tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t),
                    isPaid: editForm.isPaid,
                    price: parseFloat(editForm.price) || 0,
                    thumbnailUrl: thumbnailUrl
                }),
            });

            if (res.ok) {
                fetchData();
                fetchAnalytics();
                toast.success('Video updated successfully!');
                setIsEditModalOpen(false);
                setEditingVideo(null);
                setThumbnailFile(null);
                setThumbnailPreview(null);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update video');
            }
        } catch (err) {
            toast.error('Failed to update video: ' + err.message);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) return null;

    // Pagination Logic
    // Pagination Logic
    const getActiveData = () => {
        switch (activeTab) {
            case 'deposits':
                return deposits;
            case 'users':
                return users;
            case 'allVideos':
                return allVideos;
            default:
                return [];
        }
    };

    const activeData = getActiveData();
    const totalItems = activeData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = activeData.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
            {/* Sidebar Reused */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                        <div className="text-sm text-gray-500 breadcrumbs">
                            <span>Home</span> <span className="mx-1">/</span> <span className="text-blue-600">Dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-gray-900">{user.username}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">{user.username[0]}</div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Pending Deposits Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-900">{analytics.pendingDeposits}</h3>
                                <p className="text-gray-500 text-sm font-medium">Pending Deposits</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setActiveTab('deposits')}>View Pending</span>
                                <span className="text-gray-400 text-xs">Awaiting action</span>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                                <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>

                        {/* Manage Users Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</h3>
                                <p className="text-gray-500 text-sm font-medium">Registered Users</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                <span className="text-purple-600 font-semibold cursor-pointer" onClick={() => setActiveTab('users')}>Manage Users</span>
                                <span className="text-gray-400 text-xs">View all users</span>
                            </div>
                        </div>

                        {/* Total Users Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-full text-green-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</h3>
                                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                <span className="text-green-600 font-semibold flex items-center gap-1">
                                    +{analytics.newUsers} <span className="text-gray-400 font-normal">this week</span>
                                </span>
                            </div>
                            <div className="absolute right-0 bottom-0 w-full h-1 bg-gradient-to-r from-green-500 to-transparent"></div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{(analytics.totalRevenue / 100).toLocaleString()} ETB</h3>
                                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-xs">Total Views:</span>
                                    <span className="font-bold text-gray-700">{analytics.totalViews.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Section Grid */}
                    <div className="grid grid-cols-12 gap-8">
                        {/* Middle/Left Column: Tables (8 cols) */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            {/* Pending Items Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {activeTab === 'deposits' ? 'Pending Deposits Requests' :
                                            activeTab === 'users' ? 'Registered Users' :
                                                'All Uploaded Videos'}
                                    </h2>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveTab('deposits')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'deposits' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Deposits ({analytics.pendingDeposits})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('users')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Users
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('allVideos')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'allVideos' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            All Videos ({analytics.totalVideos})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('photos')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'photos' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Photos
                                        </button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : activeTab === 'photos' ? (
                                    <PhotosManager />
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                                        <th className="pb-3 pl-2">Item Details</th>
                                                        <th className="pb-3">User</th>
                                                        <th className="pb-3">Value/Info</th>
                                                        <th className="pb-3 text-right pr-2">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {activeTab === 'deposits' && currentItems.map((deposit) => (
                                                        <tr key={deposit.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 pl-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 cursor-pointer" onClick={() => window.open(deposit.cloudinaryUrl, '_blank')}>
                                                                        <img src={deposit.cloudinaryUrl} alt="Receipt" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800 text-sm">Deposit Request</p>
                                                                        <p className="text-xs text-gray-500 text-ellipsis max-w-[120px] overflow-hidden whitespace-nowrap">{deposit.metadata?.transactionCode || 'No Code'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-sm">
                                                                    <p className="font-medium text-gray-900">{deposit.user?.username}</p>
                                                                    <p className="text-gray-500 text-xs">{deposit.user?.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {deposit.displayAmount} ETB
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right pr-2 space-x-2">
                                                                <button
                                                                    onClick={() => handleApproveDeposit(deposit.id)}
                                                                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectDeposit(deposit.id)}
                                                                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {activeTab === 'users' && currentItems.map((user) => (
                                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 pl-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 border border-gray-300 overflow-hidden">
                                                                        {user.profilePicture ? (
                                                                            <img src={user.profilePicture} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            user.username?.[0]?.toUpperCase() || 'U'
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
                                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex flex-col gap-1.5 items-start">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.roles?.includes('admin') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {user.roles?.join(', ') || 'user'}
                                                                    </span>
                                                                    {(user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1 shadow-sm whitespace-nowrap">
                                                                            <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                            {user.subscriptionPlan || 'VIP'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-sm">
                                                                    <p className="text-gray-900 font-medium">{(user.balance / 100).toFixed(2)} ETB</p>
                                                                    <p className="text-xs text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-right pr-2">
                                                                {!user.roles?.includes('admin') && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(user._id)}
                                                                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                                                        title="Delete User"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {activeTab === 'allVideos' && currentItems.map((video) => (
                                                        <tr key={video._id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 pl-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-16 h-10 bg-gray-800 rounded overflow-hidden flex-shrink-0 relative">
                                                                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="max-w-[150px]">
                                                                        <p className="font-semibold text-gray-800 text-sm truncate">{video.title}</p>
                                                                        <p className="text-xs text-gray-400">{video.views || 0} views</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-sm">
                                                                    <p className="font-medium text-gray-900">{video.owner?.username}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                {video.isPaid ?
                                                                    <span className="text-xs font-bold text-orange-600">PAID: {(video.price / 100).toFixed(2)}</span> :
                                                                    <span className="text-xs font-bold text-green-600">FREE</span>
                                                                }
                                                                <p className="text-xs text-gray-400 mt-1">{video.duration ? Math.floor(video.duration / 60) + 'm' : ''}</p>
                                                            </td>
                                                            <td className="py-4 text-right pr-2 space-x-2">
                                                                <Link href={`/videos/${video._id}`}>
                                                                    <button
                                                                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors"
                                                                        title="View Video"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    </button>
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleEditVideo(video)}
                                                                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors"
                                                                    title="Edit Video"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteVideo(video._id, video.title)}
                                                                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                                                    title="Delete Video"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {((activeTab === 'deposits' && currentItems.length === 0) ||
                                                        (activeTab === 'users' && currentItems.length === 0) ||
                                                        (activeTab === 'allVideos' && currentItems.length === 0)) && (
                                                            <tr>
                                                                <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">
                                                                    No pending items to review.
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                        {activeTab !== 'photos' && totalPages > 1 && (
                                            <div className="flex justify-between items-center mt-4 px-2 border-t border-gray-100 pt-4">
                                                <div className="text-sm text-gray-500">
                                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-medium">{totalItems}</span> items
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handlePrevPage}
                                                        disabled={currentPage === 1}
                                                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        Previous
                                                    </button>
                                                    <div className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
                                                        {currentPage} / {totalPages}
                                                    </div>
                                                    <button
                                                        onClick={handleNextPage}
                                                        disabled={currentPage === totalPages}
                                                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${currentPage === totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Chart Section (Mock of Payment Record) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">Payment Record</h2>
                                    <button className="text-gray-400 hover:text-gray-600">...</button>
                                </div>
                                <div className="h-64 flex items-end justify-between px-2 gap-2">
                                    {[35, 55, 40, 70, 45, 60, 50, 75, 60, 80, 55, 45].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group h-full flex items-end">
                                            <div
                                                className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600"
                                                style={{ height: `${h}%` }}
                                            ></div>
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {h * 1000}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4 text-xs text-gray-400 uppercase">
                                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                                    <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Total Sales / Summary (4 cols) */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            {/* Blue Card */}
                            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-3xl font-bold">{(analytics.totalRevenue / 100).toLocaleString()}</h3>
                                        <span className="bg-blue-500 text-xs px-2 py-1 rounded">+12%</span>
                                    </div>
                                    <p className="text-blue-100 text-sm mb-4">Total Revenue Generated</p>

                                    {/* Simple Wavy Line (SVG) */}
                                    <svg className="w-full h-16 text-blue-400" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0 10 Q 25 20 50 10 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                            </div>

                            {/* Summary / Stats List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Platform Overview</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </div>
                                            <span className="text-sm font-medium">Total Views</span>
                                        </div>
                                        <span className="font-bold text-gray-800">{analytics.totalViews.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <span className="text-sm font-medium">Videos</span>
                                        </div>
                                        <span className="font-bold text-gray-800">{analytics.totalVideos.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </div>
                                            <span className="text-sm font-medium">Active Users</span>
                                        </div>
                                        <span className="font-bold text-gray-800">{analytics.activeUsers}</span>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                    Full Details
                                </button>
                            </div>
                        </div>
                    </div>
                </main >
            </div >
            {/* Rejection Modal */}
            {
                isRejectModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4 text-gray-900">Reject Deposit</h3>
                            <p className="text-gray-600 text-sm mb-4">Please enter a reason for rejection. This will be visible to the user.</p>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4 text-gray-800"
                                rows="3"
                                placeholder="e.g. Invalid Transaction ID, Amount mismatch..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={!rejectReason.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                >
                                    Reject Deposit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Delete Video Modal */}
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4 text-gray-900">⚠️ Delete Video</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Are you sure you want to delete <strong>&quot;{selectedVideoTitle}&quot;</strong>?
                            </p>
                            <p className="text-red-600 text-xs mb-6">
                                This action cannot be undone. The video will be permanently deleted from the database and storage.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteVideo}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Delete Permanently
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Edit Video Modal */}
            {
                isEditModalOpen && editingVideo && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl my-8"
                        >
                            <h3 className="text-xl font-bold mb-4 text-gray-900">✏️ Edit Video</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Editing: <strong>&quot;{editingVideo.title}&quot;</strong>
                            </p>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                        maxLength={200}
                                        placeholder="Video title"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{editForm.title.length}/200 characters</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                        rows="4"
                                        maxLength={2000}
                                        placeholder="Video description"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{editForm.description.length}/2000 characters</p>
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thumbnail Image
                                    </label>
                                    <div className="flex items-start gap-4">
                                        {/* Current Thumbnail */}
                                        <div className="flex-shrink-0">
                                            <p className="text-xs text-gray-500 mb-1">Current:</p>
                                            <img
                                                src={thumbnailPreview || editingVideo.thumbnailUrl}
                                                alt="Thumbnail"
                                                className="w-32 h-20 object-cover rounded-lg border border-gray-300"
                                            />
                                        </div>
                                        {/* Upload New */}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                                className="hidden"
                                                id="edit-thumbnail"
                                            />
                                            <label
                                                htmlFor="edit-thumbnail"
                                                className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                                            >
                                                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-xs text-gray-500">{thumbnailFile ? thumbnailFile.name : 'Click to change'}</p>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => handleEditFormChange('category', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                    >
                                        <option value="">No Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags <span className="text-gray-400 text-xs">(comma separated, max 10)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.tags}
                                        onChange={(e) => handleEditFormChange('tags', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                        placeholder="e.g. tutorial, programming, javascript"
                                    />
                                </div>

                                {/* Paid/Free */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isPaid}
                                            onChange={(e) => handleEditFormChange('isPaid', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Paid Video</span>
                                    </label>
                                </div>

                                {/* Price (if paid) */}
                                {editForm.isPaid && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price (ETB)
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={(e) => handleEditFormChange('price', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingVideo(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEditVideo}
                                    disabled={!editForm.title.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
