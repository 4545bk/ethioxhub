import Link from 'next/link';
import Navbar from './Navbar';

export default function ComingSoon({ title }) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">
                    Coming Soon
                </h1>

                <p className="text-xl text-gray-400 mb-2">
                    We are working hard to add <span className="text-white font-semibold">{title}</span>.
                </p>
                <p className="text-gray-500 mb-8 max-w-md">
                    Stay tuned! This feature will be available in future updates.
                </p>

                <Link
                    href="/"
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors transform hover:scale-105"
                >
                    Return to Home Page
                </Link>
            </div>
        </div>
    );
}
