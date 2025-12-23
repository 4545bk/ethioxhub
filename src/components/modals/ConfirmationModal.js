'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isDanger = true
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`bg-gray-900 rounded-2xl border ${isDanger ? 'border-red-500/30' : 'border-gray-700'} p-6 max-w-sm w-full shadow-2xl relative overflow-hidden`}
                    >
                        {/* Decorative background glow */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 ${isDanger ? 'bg-red-500/10' : 'bg-blue-500/10'} rounded-full blur-3xl pointer-events-none`}></div>

                        <div className="text-center relative z-10">
                            <div className={`w-16 h-16 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-300 mb-6 text-sm">
                                {message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 px-4 text-white rounded-xl font-bold shadow-lg transition transform hover:-translate-y-0.5 ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
