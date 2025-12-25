'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function SmartAlerts({ alerts }) {
    if (!alerts || alerts.length === 0) return null;

    const getAlertStyle = (type) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    text: 'text-red-100',
                    icon: '🚨'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-100',
                    icon: '⚠️'
                };
            case 'success':
                return {
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/30',
                    text: 'text-green-100',
                    icon: '🎉'
                };
            default:
                return {
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    text: 'text-blue-100',
                    icon: 'ℹ️'
                };
        }
    };

    return (
        <div className="mb-4">
            <AnimatePresence mode="popLayout">
                {alerts.map((alert, idx) => {
                    const style = getAlertStyle(alert.type);
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`${style.bg} border ${style.border} rounded-2xl p-3 mb-2 backdrop-blur-sm`}
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{style.icon}</span>
                                <div className="flex-1">
                                    <h4 className={`font-bold ${style.text} mb-0.5 text-sm`}>
                                        {alert.title}
                                    </h4>
                                    <p className="text-xs text-gray-300">
                                        {alert.message}
                                    </p>
                                    {alert.action && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                                Action:
                                            </span>
                                            <span className={`text-xs font-medium ${style.text}`}>
                                                {alert.action}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
