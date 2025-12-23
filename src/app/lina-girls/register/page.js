'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LinaRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        country: '',
        city: '',
        neighborhood: '',
        localSalary: false,
        intlSalary: false,
        contactInfo: ''
    });
    const [mainPhoto, setMainPhoto] = useState(null);
    const [additionalPhotos, setAdditionalPhotos] = useState([null, null, null]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAdditionalPhoto = (index, file) => {
        const newPhotos = [...additionalPhotos];
        newPhotos[index] = file;
        setAdditionalPhotos(newPhotos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!mainPhoto) {
            setError('Main photo is required');
            return;
        }

        if (!formData.localSalary && !formData.intlSalary) {
            setError('Please select at least one salary preference');
            return;
        }

        setSubmitting(true);

        try {
            const form = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                form.append(key, formData[key]);
            });

            // Append photos
            form.append('mainPhoto', mainPhoto);
            additionalPhotos.forEach((photo, index) => {
                if (photo) {
                    form.append(`additionalPhoto${index + 1}`, photo);
                }
            });

            const res = await fetch('/api/lina/register', {
                method: 'POST',
                body: form
            });

            const result = await res.json();

            if (result.success) {
                alert(result.message);
                router.push('/lina-girls');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-[128px] pb-12 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800"
                >
                    <h1 className="text-3xl font-extrabold text-white mb-2 text-center">
                        Lina Agency Registration
                    </h1>
                    <p className="text-gray-400 text-center mb-8">
                        Fill out the form below to join our platform
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Age * (Must be 18+)
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                placeholder="Enter your age"
                                min="18"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Country *
                            </label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            >
                                <option value="" className="bg-gray-800">Select your country</option>
                                <option value="Ethiopia" className="bg-gray-800">Ethiopia</option>
                                <option value="Kenya" className="bg-gray-800">Kenya</option>
                                <option value="Uganda" className="bg-gray-800">Uganda</option>
                                <option value="Tanzania" className="bg-gray-800">Tanzania</option>
                                <option value="Other" className="bg-gray-800">Other</option>
                            </select>
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                City (Optional)
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="e.g., Addis Ababa"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Neighborhood */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Neighborhood/Area (Optional)
                            </label>
                            <input
                                type="text"
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleInputChange}
                                placeholder="e.g., Bole, Piassa"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Salary Preferences */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                Salary Preferences (I agree to work for this Price) *
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="localSalary"
                                        checked={formData.localSalary}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-3 text-gray-300">Local Client (5k-10k)</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="intlSalary"
                                        checked={formData.intlSalary}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-3 text-gray-300">International Client (15k-20k)</span>
                                </label>
                            </div>
                        </div>

                        {/* Main Photo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Your Main Photo * (First required)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setMainPhoto(e.target.files[0])}
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 text-gray-300"
                            />
                        </div>

                        {/* Additional Photos */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Additional Photos (Optional, up to 3)
                            </label>
                            <div className="space-y-2">
                                {[0, 1, 2].map(index => (
                                    <input
                                        key={index}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleAdditionalPhoto(index, e.target.files[0])}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 text-gray-400"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Contact Info (Phone) *
                            </label>
                            <input
                                type="tel"
                                name="contactInfo"
                                value={formData.contactInfo}
                                onChange={handleInputChange}
                                placeholder="e.g., 0912345678"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-orange-500 text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Registering...' : 'Register Now'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
