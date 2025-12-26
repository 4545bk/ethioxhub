'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session on mount
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                // Token expired, try refresh
                await refreshToken();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            const res = await fetch('/api/auth/refresh', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('accessToken', data.accessToken);
                setUser(data.user);
                return true;
            }
        } catch (err) {
            console.error('Token refresh failed:', err);
        }
        return false;
    };

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    };

    const register = async (username, email, password, referralCode, shareCode) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, verifiedAge: true, referralCode, shareCode }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    };

    const loginWithGoogle = async (credential) => {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Google login failed');
        }

        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('accessToken');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshToken, refreshUser: checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
