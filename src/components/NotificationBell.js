'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Poll for notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const res = await fetch('/api/user/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const serverNotifications = data.notifications || [];

                    // Map to component format
                    const formatted = serverNotifications.map(n => ({
                        id: n._id || n.createdAt,
                        type: n.type || 'info', // 'referral' | 'info' | 'success' | 'warning'
                        message: n.message,
                        link: n.link || '#',
                        date: new Date(n.createdAt),
                        read: n.read
                    }));

                    setNotifications(formatted);

                    // Check if there are any unread
                    const hasUnreadItems = formatted.some(n => !n.read);
                    // Also check local storage for 'seen' if needed, but rely on 'read' flag from server ideally.
                    // For now, simpler: just check unread flag.
                    // But our server schema has 'read' field.

                    // Since we don't have an API to mark as read yet, implementation of markAsRead 
                    // will be client-side only visual or we need POST endpoint.
                    // For MVP, client-side 'hasUnread' state logic:
                    // If we have items that we haven't 'seen' in this session or strict read check.
                    // Let's stick to LocalStorage 'seen' logic for persistence without API write for now.

                    const seenIds = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
                    const reallyNew = formatted.filter(n => !seenIds.includes(n.id) && !n.read);

                    if (reallyNew.length > 0) {
                        setHasUnread(true);
                    }
                }
            } catch (err) {
                console.error('Notification poll failed', err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = () => {
        setHasUnread(false);
        const seenIds = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
        const newIds = notifications.map(n => n.id);
        localStorage.setItem('seenNotifications', JSON.stringify([...new Array(...seenIds, ...newIds)]));
    };

    const toggleDropdown = () => {
        if (!isOpen) markAsRead();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative text-gray-300 hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {hasUnread && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-3 border-b border-gray-800">
                            <h3 className="text-white font-semibold">Notifications</h3>
                        </div>

                        <div className="max-h-80 overflow-y-auto w-full">
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <Link
                                        key={notification.id}
                                        href={notification.link}
                                        className="block p-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-0"
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notification.type === 'rejected' ? 'bg-red-500' : 'bg-green-500'
                                                }`} />
                                            <div>
                                                <p className="text-sm text-gray-200">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {notification.date.toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
