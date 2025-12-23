'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8"
            >
                <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 text-center">
                    Lina Agency Registration Form
                </h1>
                <p className="text-gray-600 text-center mb-8">
                    Fill out the form below to join our platform
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Country *
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        >
                            <option value="">Select your country</option>
                            <option value="Ethiopia">Ethiopia</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Uganda">Uganda</option>
                            <option value="Tanzania">Tanzania</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City (Optional)
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="e.g., Addis Ababa"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Neighborhood */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Neighborhood/Area (Optional)
                        </label>
                        <input
                            type="text"
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleInputChange}
                            placeholder="e.g., Bole, Piassa"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Salary Preferences */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Salary Preferences (I agree to work for this Price) *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="localSalary"
                                    checked={formData.localSalary}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                />
                                <span className="ml-3 text-gray-700">Local Client (5k-10k)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="intlSalary"
                                    checked={formData.intlSalary}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                />
                                <span className="ml-3 text-gray-700">International Client (15k-20k)</span>
                            </label>
                        </div>
                    </div>

                    {/* Main Photo */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Main Photo * (First required)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setMainPhoto(e.target.files[0])}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        />
                    </div>

                    {/* Additional Photos */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Additional Photos (Optional, up to 3)
                        </label>
                        <div className="space-y-2">
                            {[0, 1, 2].map(index => (
                                <input
                                    key={index}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleAdditionalPhoto(index, e.target.files[0])}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contact Info (Phone) *
                        </label>
                        <input
                            type="tel"
                            name="contactInfo"
                            value={formData.contactInfo}
                            onChange={handleInputChange}
                            placeholder="e.g., 0912345678"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold rounded-lg shadow-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Registering...' : 'Register Now'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
