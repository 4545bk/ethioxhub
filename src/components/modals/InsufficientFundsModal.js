'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function InsufficientFundsModal({ isOpen, onClose, message, requiredAmount, currentBalance }) {
    const router = useRouter();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-gray-900 rounded-2xl border border-red-900/50 p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative background glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="text-center relative z-10">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Insufficient Balance 💸</h3>
                            <p className="text-gray-300 mb-6 text-sm">
                                {message || "You don't have enough ETB for this action."}
                            </p>

                            {/* Optional Details: Only show if explicit props are passed, otherwise rely on the message string */}
                            {(requiredAmount !== undefined && currentBalance !== undefined) && (
                                <div className="bg-gray-800/50 rounded-lg p-3 mb-6 text-sm">
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>Required:</span>
                                        <span className="text-white font-medium">{requiredAmount} ETB</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Available:</span>
                                        <span className="text-red-400 font-medium">{currentBalance} ETB</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/deposit')}
                                    className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <span>💳 Deposit Funds</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 px-4 bg-transparent text-gray-500 hover:text-gray-300 font-medium transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
