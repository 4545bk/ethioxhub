"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Component to handle the error logic with useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-indigo-900 mb-4">Authentication Error</h1>
      <p className="text-red-500 mb-4">
        {error === "CredentialsSignin" ? "Invalid email or password" : error || "An unexpected error occurred"}
      </p>
      <a
        href="/auth/signin"
        className="inline-block py-2 px-6 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105"
      >
        Back to Sign In
      </a>
    </div>
  );
}

// Main page component with Suspense
export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 flex items-center justify-center">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}