"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const handleManualSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("Sign-in failed. Please try again.");
    }
  };

  const handleGoogleSignIn = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=https://getlinaagency.vercel.app/api/auth/callback/google&response_type=code&scope=email%20profile`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(googleAuthUrl);
    } else {
      signIn("google", { callbackUrl });
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-indigo-900 mb-6">Sign In to Lina Agency</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {urlError && <p className="text-red-500 mb-4">Invalid email or password (from URL)</p>}
      <form onSubmit={handleManualSignIn} className="space-y-4">
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
          className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-full font-medium shadow-lg hover:from-indigo-600 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105"
        >
          Sign In Manually
        </button>
      </form>
      <button
        onClick={handleGoogleSignIn}
        className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105"
      >
        Sign In with Google
      </button>
      <p className="mt-4 text-center text-sm text-gray-700">
        Don’t have an account?{" "}
        <a href="/auth/register" className="text-teal-500 hover:underline">
          Register Manually
        </a>
      </p>
    </div>
  );
}

export default function SignInPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Render nothing on the server
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 flex items-center justify-center">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}