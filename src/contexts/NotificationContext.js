'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);

    const fetchNotifications = async () => {
        try {
            let token = localStorage.getItem('accessToken');
            if (!token) {
                setNotifications([]);
                return;
            }

            let res = await fetch('/api/user/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If token expired, try to refresh
            if (res.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const refreshRes = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });

                    if (refreshRes.ok) {
                        const { accessToken } = await refreshRes.json();
                        localStorage.setItem('accessToken', accessToken);
                        // Retry with new token
                        res = await fetch('/api/user/notifications', {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        });
                    }
                }
            }

            if (res && res.ok) {
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

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = () => {
        setHasUnread(false);
        const seenIds = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
        const newIds = notifications.map(n => n.id);
        const uniqueIds = [...new Set([...seenIds, ...newIds])]; // Ensure uniqueness
        localStorage.setItem('seenNotifications', JSON.stringify(uniqueIds));
    };

    return (
        <NotificationContext.Provider value={{ notifications, hasUnread, fetchNotifications, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);
