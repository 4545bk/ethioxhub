'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();
    const [balance, setBalance] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isAdminPage = pathname?.startsWith('/admin');
    const isSubscriber = user && (user.isSubscriber || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()));
    const daysRemaining = user?.subscriptionExpiresAt
        ? Math.ceil((new Date(user.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

    useEffect(() => {
        if (user) {
            setBalance(user.balance || 0);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        router.push('/login');
        setShowMobileMenu(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/?search=${encodeURIComponent(searchQuery)}`);
            setShowMobileMenu(false);
        }
    };

    const navItems = [
        { name: t('home').toUpperCase(), href: '/' },
        { name: t('categories').toUpperCase(), href: '/categories' }, // Replaced COURSE VIDEOS with CATEGORIES as primary
        { name: isSubscriber ? 'VIP MEMBER' : t('subscribe').toUpperCase(), href: '/pricing' },
        { name: 'PHOTOS', href: '/photos' },
        { name: 'LINA GIRLS', href: '/lina-girls' },
        { name: 'INSTRUCTORS', href: '/instructors' },
        { name: 'COMMUNITY', href: '/community' },
    ];

    return (
        <>
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-gray-800">
                <div className="container mx-auto px-2 sm:px-4">
                    <div className="flex items-center justify-between h-14 gap-2">
                        {/* Left: Menu + Logo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="text-white hover:bg-gray-800 p-1.5 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <Link href="/" className="flex items-center">
                                <span className="text-lg sm:text-xl font-bold text-white">Ethiox</span>
                                <span className="bg-orange-500 px-1 text-lg sm:text-xl font-bold text-white">hub</span>
                            </Link>
                        </div>

                        {/* Center: Search (Visible on Mobile now) */}
                        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative min-w-0">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('search')}
                                    className="w-full bg-gray-800 border border-gray-700 text-white pl-9 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 rounded focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {/* Right: Subscribe + (Notifications/User hidden on mobile) */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Language Switcher */}
                            <button
                                onClick={toggleLanguage}
                                className="text-gray-300 hover:text-white font-medium text-xs sm:text-sm border border-gray-700 rounded px-2 py-1"
                            >
                                {language === 'en' ? 'AM' : 'EN'}
                            </button>

                            {user ? (
                                <>
                                    {!isAdminPage && (
                                        isSubscriber ? (
                                            <Link
                                                href="/pricing"
                                                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded font-bold text-xs sm:text-sm transition-all shadow-lg border border-yellow-300/50 flex items-center gap-1.5 transform hover:scale-105"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                SUBSCRIBED
                                            </Link>
                                        ) : (
                                            <Link
                                                href="/pricing"
                                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
                                            >
                                                {t('subscribe').toUpperCase()}
                                            </Link>
                                        )
                                    )}

                                    {/* Notifications (Hidden on mobile, in menu) */}
                                    <div className="hidden md:block">
                                        <NotificationBell />
                                    </div>

                                    {/* User (Hidden on mobile, in menu) */}
                                    <div className="relative hidden md:block">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:scale-110 transition-transform overflow-hidden ${user.isSubscriber || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date())
                                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 ring-2 ring-yellow-500/50'
                                                : 'bg-gradient-to-br from-orange-500 to-pink-500'
                                                }`}
                                        >
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                user.username?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {showUserMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20"
                                                >
                                                    <div className="px-4 py-3 border-b border-gray-800">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-white font-medium text-sm truncate max-w-[120px]">{user.username}</p>
                                                            {(user.isSubscriber || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date())) && (
                                                                <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-sm">
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    {user.subscriptionPlan || 'VIP'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 text-xs">{user.email}</p>

                                                        {isSubscriber && (
                                                            <div className="mt-3 mb-2 bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-lg p-2.5 border border-yellow-500/20 shadow-inner">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">
                                                                        {user.subscriptionPlan || 'VIP Plan'}
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold ${daysRemaining <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                                                                        {daysRemaining} Days Left
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] text-gray-400">Expires</span>
                                                                    <span className="text-[10px] text-gray-300 font-medium">
                                                                        {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!isAdminPage && (
                                                            <div className="mt-2 flex items-center gap-1 text-yellow-500 text-sm">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="font-semibold">{(balance / 100).toFixed(2)} ETB</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isAdminPage && (
                                                        <>
                                                            <Link href="/history" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 text-sm">{t('myHistory')}</Link>
                                                            <Link href="/my-deposits" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 text-sm">{t('myDeposits')}</Link>
                                                            <Link href="/deposit" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 text-sm">{t('deposit')}</Link>
                                                        </>
                                                    )}

                                                    {user?.roles?.includes('admin') && (
                                                        <Link href="/admin" className="block px-4 py-2 text-blue-400 hover:bg-gray-800 text-sm">{t('adminPanel')}</Link>
                                                    )}
                                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 text-sm border-t border-gray-800">{t('logout')}</button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Link href="/login" className="text-gray-300 hover:text-white text-xs sm:text-sm">{t('login')}</Link>
                                    <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold text-xs sm:text-sm">{t('register')}</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar / Drawer */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                            className="fixed inset-0 bg-black z-40"
                        />

                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-0 left-0 w-72 h-full bg-gray-900 z-50 shadow-2xl overflow-y-auto border-r border-gray-800"
                        >
                            <div className="flex items-center gap-2 p-4 border-b border-gray-800">
                                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <span className="text-xl font-bold text-white">Ethiox<span className="text-orange-500">hub</span></span>
                            </div>

                            {user && (
                                <div className="p-4 bg-gray-800/50 border-b border-gray-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden ${user.isSubscriber || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date())
                                            ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 ring-2 ring-yellow-500/50'
                                            : 'bg-orange-500'
                                            }`}>
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                user.username?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-white">{user.username}</p>
                                                {(user.isSubscriber || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date())) && (
                                                    <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                        {user.subscriptionPlan || 'VIP'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </div>

                                    {isSubscriber && (
                                        <div className="mb-3 bg-gray-900/50 rounded-lg p-3 border border-yellow-500/20">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs uppercase font-bold text-yellow-500 tracking-wider">
                                                    {user.subscriptionPlan || 'VIP Plan'}
                                                </span>
                                                <span className={`text-xs font-bold ${daysRemaining <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {daysRemaining} Days Left
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">Expires</span>
                                                <span className="text-xs text-gray-300 font-medium">
                                                    {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {!isAdminPage && (
                                        <div className="flex items-center gap-2 text-yellow-400 font-bold bg-black/30 p-2 rounded">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                            {(balance / 100).toFixed(2)} ETB
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="py-2">
                                {user && !isAdminPage && (
                                    <>
                                        <Link href="/history" className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800" onClick={() => setShowMobileMenu(false)}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Watch History
                                        </Link>
                                        <Link href="/my-deposits" className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800" onClick={() => setShowMobileMenu(false)}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            My Deposits
                                        </Link>
                                        <Link href="/deposit" className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800" onClick={() => setShowMobileMenu(false)}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Deposit Funds
                                        </Link>

                                        <div className="px-6 py-3 border-t border-gray-800">
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">Notifications</p>
                                            <NotificationBell />
                                        </div>
                                        <div className="border-t border-gray-800 my-2"></div>
                                    </>
                                )}

                                {navItems.map(item => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                {user && (
                                    <>
                                        <div className="border-t border-gray-800 my-2"></div>
                                        {user.roles?.includes('admin') && (
                                            <Link href="/admin" className="flex items-center gap-3 px-6 py-3 text-blue-400 hover:bg-gray-800" onClick={() => setShowMobileMenu(false)}>
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-gray-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Logout
                                        </button>
                                    </>
                                )}

                                {!user && (
                                    <div className="p-4 flex flex-col gap-3">
                                        <Link href="/login" className="text-center py-2 border border-gray-600 rounded text-white" onClick={() => setShowMobileMenu(false)}>Login</Link>
                                        <Link href="/register" className="text-center py-2 bg-orange-500 rounded text-white font-bold" onClick={() => setShowMobileMenu(false)}>Sign Up</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {!isAdminPage && (
                <nav className="fixed top-14 left-0 right-0 z-30 bg-black border-b border-gray-800 hidden md:block">
                    <div className="container mx-auto px-4">
                        <div className="flex w-full justify-between items-center py-2">
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`text-sm whitespace-nowrap px-2 py-2 transition-colors border-b-2 ${index === 0
                                        ? 'text-white border-white'
                                        : 'text-gray-300 border-transparent hover:text-white hover:border-gray-700'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>
            )}

            {!isAdminPage && (
                <div className="fixed top-[100px] left-0 right-0 z-20 bg-gray-900 py-2 text-center text-sm border-b border-gray-800 hidden md:block">
                    <p className="text-gray-300">
                        Make any learning path with official Ethioxhub membership{' '}
                        <span className="text-yellow-400 font-semibold">accessible!</span>{' '}
                        <Link href="/pricing" className="text-blue-400 underline hover:text-blue-300">
                            Shop now!
                        </Link>
                    </p>
                </div>
            )}
        </>
    );
}
