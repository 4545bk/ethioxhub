'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import AdminEditLinaModal from '@/components/admin/AdminEditLinaModal';

export default function AdminLinaPage() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Modal States
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [editModal, setEditModal] = useState({ open: false, profile: null });

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/lina/profiles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setProfiles(data.profiles);
            } else {
                showToast(data.error || 'Failed to fetch profiles', 'error');
            }
        } catch (error) {
            showToast('Error fetching profiles', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Delete Logic ---
    const handleDeleteClick = (id) => {
        setDeleteModal({ open: true, id });
    };

    const handleConfirmDelete = async () => {
        const id = deleteModal.id;
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/lina/profiles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setProfiles(prev => prev.filter(p => p._id !== id));
                showToast('Profile deleted successfully', 'success');
            } else {
                showToast(data.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            showToast('Error deleting profile', 'error');
        } finally {
            setDeleteModal({ open: false, id: null });
        }
    };

    // --- Edit Logic ---
    const handleEditClick = (profile) => {
        setEditModal({ open: true, profile });
    };

    const handleSaveEdit = async (id, formData) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/lina/profiles/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                // Update local state with returned profile
                setProfiles(prev => prev.map(p =>
                    p._id === id ? data.profile : p
                ));
                showToast('Profile updated successfully', 'success');
                setEditModal({ open: false, profile: null });
            } else {
                showToast(data.error || 'Failed to update', 'error');
            }
        } catch (error) {
            showToast('Error updating profile', 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/lina/profiles/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const data = await res.json();

            if (data.success) {
                setProfiles(prev => prev.map(p =>
                    p._id === id ? { ...p, isActive: !currentStatus } : p
                ));
                showToast(`Profile ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (error) {
            showToast('Error updating status', 'error');
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <AdminSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Lina Girls Management</h1>
                        <p className="text-gray-400">Manage profiles, photos, and visibility.</p>
                    </div>
                    <Link
                        href="/lina-girls/register"
                        target="_blank"
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition shadow-lg flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add New Profile</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-lg">No profiles found.</p>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Salary</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {profiles.map((profile) => (
                                        <motion.tr
                                            key={profile._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-800/30 transition shadow-inner"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 border border-gray-600 relative group">
                                                        <img
                                                            src={profile.photoUrl}
                                                            alt={profile.name}
                                                            className="h-full w-full object-cover transition transform group-hover:scale-110"
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-white">{profile.name}</div>
                                                        <div className="text-xs text-gray-500">{profile.age} years old</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">{profile.country}</div>
                                                <div className="text-xs text-gray-500">{profile.city || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    {profile.localSalary && (
                                                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-200 w-fit">
                                                            Local
                                                        </span>
                                                    )}
                                                    {profile.intlSalary && (
                                                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900/50 text-purple-200 w-fit">
                                                            International
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                                {profile.contactInfo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(profile._id, profile.isActive)}
                                                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${profile.isActive ? 'bg-green-600' : 'bg-gray-700'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${profile.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <div className="text-[10px] mt-1 text-gray-500">{profile.isActive ? 'Active' : 'Hidden'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => handleEditClick(profile)}
                                                        className="text-blue-400 hover:text-blue-300 transition p-2 hover:bg-blue-900/20 rounded-lg group"
                                                        title="Edit Profile"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(profile._id)}
                                                        className="text-red-400 hover:text-red-300 transition p-2 hover:bg-red-900/20 rounded-lg group"
                                                        title="Delete Profile"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Profile?"
                message="Are you sure you want to delete this profile? This cannot be undone."
                confirmText="Delete Profile"
                cancelText="Cancel"
                isDanger={true}
            />

            <AdminEditLinaModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, profile: null })}
                profile={editModal.profile}
                onSave={handleSaveEdit}
            />
        </div>
    );
}
