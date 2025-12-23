'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LinaRegisterPage() {
    const router = useRouter();

    // Options with Amharic translations
    const countries = [
        "Ethiopia (ኢትዮጵያ)",
        "Dubai (ዱባይ)",
        "UAE (ዩ.ኤ.ኢ)",
        "South Africa (ደቡብ አፍሪካ)",
        "United States (አሜሪካ)",
        "United Kingdom (እንግሊዝ)"
    ];

    const ethiopianCities = [
        "Addis Ababa (አዲስ አበባ)",
        "Hawassa (ሀዋሳ)",
        "Adama (አዳማ)",
        "Harer (ሐረር)",
        "Dire Dawa (ድሬዳዋ)"
    ];

    const addisNeighborhoods = [
        "Kazanchis (ካዛንቺስ)",
        "Ayat (አያት)",
        "Summit (ሰሚት)",
        "Piassa (ፒያሳ)",
        "22 (ሃያ ሁለት)",
        "Megenagna (መገናኛ)",
        "Bole (ቦሌ)",
        "Saris (ሳሪስ)",
        "Gerji (ገርጂ)",
        "Sar Bet (ሳር ቤት)",
        "Mebrat Hail (መብራት ሀይል)",
        "Asco (አስኮ)",
        "Kebena (ቀበና)",
        "Tulu Dimtu (ቱሉ ዲምቱ)",
        "6 Kilo (6ኪሎ)",
        "Wesen (ወሰን)",
        "Kechen (ቀጨኔ)",
        "Gofa (ጎፋ)",
    ];

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        country: '',
        city: '',
        neighborhood: '',
        customNeighborhood: false,
        agreeToSalary: false,
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

        if (name === 'country') {
            setFormData(prev => ({
                ...prev,
                country: value,
                city: '',
                neighborhood: '',
                customNeighborhood: false
            }));
        } else if (name === 'city') {
            setFormData(prev => ({
                ...prev,
                city: value,
                neighborhood: '',
                customNeighborhood: false
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
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
            setError('Main photo is required (ዋና ፎቶ ያስፈልጋል)');
            return;
        }

        if (!formData.agreeToSalary) {
            setError('You must agree to the salary terms (በደመወዝ ውሉ መስማማት አለብዎ)');
            return;
        }

        if (!formData.localSalary && !formData.intlSalary) {
            setError('Please select at least one salary preference (ቢያንስ አንድ የደመወዝ ምርጫ ይምረጡ)');
            return;
        }

        setSubmitting(true);

        try {
            const form = new FormData();

            Object.keys(formData).forEach(key => {
                if (key === 'neighborhood' && formData.customNeighborhood) {
                    form.append(key, formData.neighborhood);
                } else if (key !== 'customNeighborhood') {
                    form.append(key, formData[key]);
                }
            });

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
                alert('Registration successful! You will be contacted soon. (ምዝገባው ተሳክቷል! በቅርቡ እናገኝዎታለን)');
                router.push('/lina-girls');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Network error. Please try again. (የኔትወርክ ስህተት። እባክዎ እንደገና ይሞክሩ)');
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
                        Lina Agency Registration <span className="block text-xl font-medium text-orange-500 mt-1">(ሊና ኤጀንሲ ምዝገባ)</span>
                    </h1>
                    <p className="text-gray-400 text-center mb-8">
                        Fill out the form below to join our platform <br />
                        <span className="text-sm">(ለመቀላቀል ከታች ያለውን ቅጽ ይሙሉ)</span>
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
                                Full Name (ሙሉ ስም) *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name (ስምዎን ያስገቡ)"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Age (እድሜ) * <span className="text-xs text-gray-500">(Must be 18+ / 18 ዓመት እና ከዚያ በላይ)</span>
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                placeholder="Enter your age (እድሜዎን ያስገቡ)"
                                min="18"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Country (ሀገር) *
                            </label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            >
                                <option value="" className="bg-gray-800">Select your country (ሀገር ይምረጡ)</option>
                                {countries.map((country) => (
                                    <option key={country} value={country} className="bg-gray-800">
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* City Logic */}
                        {formData.country && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    City (ከተማ) *
                                </label>
                                {formData.country.includes("Ethiopia") ? (
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    >
                                        <option value="" className="bg-gray-800">Select your city (ከተማ ይምረጡ)</option>
                                        {ethiopianCities.map((city) => (
                                            <option key={city} value={city} className="bg-gray-800">
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter your city (ከተማዎን ያስገቡ)"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                                    />
                                )}
                            </div>
                        )}

                        {/* Neighborhood Logic */}
                        {formData.city && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Neighborhood/Area (ሰፈር) (Optional)
                                </label>
                                {formData.city.includes("Addis Ababa") ? (
                                    <div className="space-y-3">
                                        {!formData.customNeighborhood && (
                                            <select
                                                name="neighborhood"
                                                value={formData.neighborhood}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                            >
                                                <option value="" className="bg-gray-800">Select your neighborhood (ሰፈር ይምረጡ)</option>
                                                {addisNeighborhoods.map((hood) => (
                                                    <option key={hood} value={hood} className="bg-gray-800">
                                                        {hood}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {formData.customNeighborhood && (
                                            <input
                                                type="text"
                                                name="neighborhood"
                                                value={formData.neighborhood}
                                                onChange={handleInputChange}
                                                placeholder="Write your place (ቦታዎን ይጻፉ)"
                                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                                            />
                                        )}
                                        <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="customNeighborhood"
                                                checked={formData.customNeighborhood}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                            />
                                            <span>Write your place if not listed (ከዝርዝሩ ውስጥ ከሌለ ይጻፉ)</span>
                                        </label>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        name="neighborhood"
                                        value={formData.neighborhood}
                                        onChange={handleInputChange}
                                        placeholder="Enter your neighborhood (ሰፈርዎን ያስገቡ)"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder-gray-500"
                                    />
                                )}
                            </div>
                        )}

                        {/* Salary Preferences */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                Salary Preferences (የደመወዝ ምርጫዎች) *
                            </label>

                            <label className="flex items-center space-x-2 mb-3 text-sm text-gray-400 cursor-pointer p-2 rounded hover:bg-gray-800/50">
                                <input
                                    type="checkbox"
                                    name="agreeToSalary"
                                    checked={formData.agreeToSalary}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                />
                                <span>I agree to work for the selected Price (በተመረጠው ዋጋ ለመስራት እስማማለሁ)</span>
                            </label>

                            <div className="space-y-2 ml-4">
                                <label className={`flex items-center cursor-pointer ${!formData.agreeToSalary ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="checkbox"
                                        name="localSalary"
                                        checked={formData.localSalary}
                                        onChange={handleInputChange}
                                        disabled={!formData.agreeToSalary}
                                        className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-3 text-gray-300">Local Client (5k-10k) (ለሀገር ውስጥ - 5k-10k)</span>
                                </label>
                                <label className={`flex items-center cursor-pointer ${!formData.agreeToSalary ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="checkbox"
                                        name="intlSalary"
                                        checked={formData.intlSalary}
                                        onChange={handleInputChange}
                                        disabled={!formData.agreeToSalary}
                                        className="w-5 h-5 text-orange-600 rounded bg-gray-800 border-gray-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-3 text-gray-300">International Client (15k-20k) (ለውጭ ሀገር - 15k-20k)</span>
                                </label>
                            </div>
                        </div>

                        {/* Main Photo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Your Main Photo (ዋና ፎቶ) * <span className="text-xs font-normal text-gray-500">(First required / የመጀመሪያው ግዴታ ነው)</span>
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
                                Additional Photos (ተጨማሪ ፎቶዎች) <span className="text-xs font-normal text-gray-500">(Optional, up to 3 / እስከ 3 አማራጭ)</span>
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
                                Contact Info (Phone/ስልክ) *
                            </label>
                            <input
                                type="tel"
                                name="contactInfo"
                                value={formData.contactInfo}
                                onChange={handleInputChange}
                                placeholder="e.g., 0912345678 (ለምሳሌ 09...)"
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
                            {submitting ? 'Registering... (በመመዝገብ ላይ...)' : 'Register Now (ይመዝገቡ)'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
