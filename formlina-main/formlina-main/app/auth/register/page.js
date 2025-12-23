"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Registration successful! Please sign in.");
        router.push("/auth/signin"); // Explicit redirect to sign-in
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-indigo-900 mb-6">Register for Lina Agency</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full font-medium shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-300 transform hover:scale-105"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <a href="/auth/signin" className="text-teal-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}