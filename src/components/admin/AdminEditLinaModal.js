'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminEditLinaModal({ isOpen, onClose, profile, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        country: '',
        city: '',
        neighborhood: '',
        contactInfo: '',
        localSalary: false,
        intlSalary: false,
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                age: profile.age || '',
                country: profile.country || '',
                city: profile.city || '',
                neighborhood: profile.neighborhood || '',
                contactInfo: profile.contactInfo || '',
                localSalary: profile.localSalary || false,
                intlSalary: profile.intlSalary || false,
                isActive: profile.isActive ?? true
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(profile._id, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl shadow-2xl my-8"
                    >
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Contact Info (Phone)</label>
                                    <input
                                        type="text"
                                        name="contactInfo"
                                        value={formData.contactInfo}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Neighborhood */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Neighborhood</label>
                                    <input
                                        type="text"
                                        name="neighborhood"
                                        value={formData.neighborhood}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-3">Salary Preferences</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="localSalary"
                                            checked={formData.localSalary}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600"
                                        />
                                        <span className="ml-2 text-white">Local</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="intlSalary"
                                            checked={formData.intlSalary}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600"
                                        />
                                        <span className="ml-2 text-white">International</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-3">Settings</label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-green-600 rounded bg-gray-800 border-gray-600"
                                    />
                                    <span className="ml-2 text-white">Is Active (Visible on site)</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition shadow-lg disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
