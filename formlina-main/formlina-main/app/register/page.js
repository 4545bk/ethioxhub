"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "",
    city: "",
    neighborhood: "",
    agreeToSalary: false,
    localSalary: false,
    intlSalary: false,
    photos: [],
    contactInfo: "",
    customNeighborhood: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      const selectedFiles = files ? Array.from(files) : [];
      console.log("Files selected:", selectedFiles);
      setFormData((prev) => ({ ...prev, photos: selectedFiles }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "country" && value !== "Ethiopia" && { city: "", neighborhood: "", customNeighborhood: false }),
        ...(name === "city" && value !== "Addis Ababa" && { neighborhood: "", customNeighborhood: false }),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data before submit:", formData);
    if (!formData.photos.length) {
      setError("At least one photo is required.");
      return;
    }
    setLoading(true);
    setError(null);

    const data = new FormData();
    for (const key in formData) {
      if (key === "photos") {
        formData.photos.forEach((photo, index) => data.append(`photo${index}`, photo));
      } else if (key === "neighborhood" && formData.customNeighborhood) {
        data.append(key, formData.neighborhood);
      } else if (key !== "customNeighborhood") {
        data.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch("/api/register", { method: "POST", body: data });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
        setTimeout(() => router.push("/success"), 2000);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const countries = ["Ethiopia", "Dubai", "UAE", "South Africa", "United States", "United Kingdom"];
  const ethiopianCities = ["Addis Ababa", "Hawassa", "Adama", "Harer", "Dire Dawa"];
  const addisNeighborhoods = [
    "ካዛንቺስ",
    "አያት",
    "ሰሚት",
    "ፒያሳ",
    "ሃያ ሁለት",
    "መገናኛ",
    "ቦሌ",
    "ሳሪስ",
    "ገርጂ",
    "ሳር ቤት",
    "መብራት ሀይል",
    "አስኮ",
    "ቀበና",
    "ቱሉ ዲምቱ",
    "6ኪሎ",
    "ወሰን",
    "ቀጨኔ",
    "ጎፋ",
  ];

  if (!isMounted) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-700 to-teal-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="checkmark-circle mx-auto mb-4">
            <div className="checkmark draw"></div>
          </div>
          <h2 className="text-xl font-semibold text-teal-900">Right ✅</h2>
          <p className="text-sm text-gray-700 mt-2">You have successfully submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-700 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all hover:scale-105 duration-300">
        <h1 className="text-2xl font-bold text-teal-900 mb-6 text-center">Lina Agency Registration Form</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="18"
              required
              className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
              placeholder="Enter your age"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {formData.country === "Ethiopia" && (
            <div>
              <label className="block text-xs font-medium text-gray-700">City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
              >
                <option value="">Select your city</option>
                {ethiopianCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.country === "Ethiopia" && formData.city === "Addis Ababa" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700">Neighborhood</label>
              {formData.customNeighborhood ? (
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
                  placeholder="Write your place"
                />
              ) : (
                <select
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
                >
                  <option value="">Select your neighborhood</option>
                  {addisNeighborhoods.map((neighborhood) => (
                    <option key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-center text-xs text-gray-600 mt-2">
                <input
                  type="checkbox"
                  name="customNeighborhood"
                  checked={formData.customNeighborhood}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                Write your place if not listed
              </label>
            </div>
          ) : (
            formData.country && (
              <>
                {formData.country !== "Ethiopia" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">City (Optional)</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
                      placeholder="Enter your city"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700">Neighborhood (Optional)</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
                    placeholder="Enter your neighborhood"
                  />
                </div>
              </>
            )
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Salary Preferences (I agree to work for this Price)
            </label>
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                name="agreeToSalary"
                checked={formData.agreeToSalary}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              I agree to work for the selected Price
            </label>
            <div className="mt-2 flex space-x-6">
              <label className="flex items-center text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="localSalary"
                  checked={formData.localSalary}
                  onChange={handleChange}
                  disabled={!formData.agreeToSalary}
                  className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded disabled:opacity-50"
                />
                Local Client(5k-10k)
              </label>
              <label className="flex items-center text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="intlSalary"
                  checked={formData.intlSalary}
                  onChange={handleChange}
                  disabled={!formData.agreeToSalary}
                  className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded disabled:opacity-50"
                />
                International Client (15k-20k)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Your sexy Photos (First required, others optional)</label>
            <div className="mt-1 flex items-center space-x-2">
              <label className="relative inline-block">
                <input
                  type="file"
                  name="photos"
                  onChange={handleChange}
                  accept="image/*"
                  multiple
                  className="absolute opacity-0 w-0 h-0"
                />
                <span className="inline-block px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 transition duration-200 cursor-pointer">
                  Choose Files
                </span>
              </label>
              <svg
                className="w-4 h-4 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v12"
                />
              </svg>
              <span className="text-xs text-gray-600">
                {formData.photos.length > 0 ? `${formData.photos.length} file(s) selected` : "No file chosen"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Contact Info (Phone)</label>
            <input
              type="text"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 placeholder-gray-400 text-sm"
              placeholder="e.g., 097363663"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 transition duration-200 text-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Submitting..." : "Register Now"}
          </button>
        </form>
      </div>
    </div>
  );
}