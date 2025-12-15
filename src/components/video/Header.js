import { Search, Bell, ChevronDown } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '../NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = ({ user }) => {
    const router = useRouter();
    const { t, language, toggleLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 bg-secondary rounded-full px-4 py-2.5 w-full max-w-md hidden sm:flex">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
                />
            </form>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="text-foreground hover:text-primary font-medium text-xs sm:text-sm border border-border rounded px-2 py-1"
                >
                    {language === 'en' ? 'AM' : 'EN'}
                </button>

                {/* Notification Bell */}
                {user && (
                    <div className="hidden md:block">
                        <NotificationBell />
                    </div>
                )}

                {/* User Profile */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm hover:scale-110 transition-transform overflow-hidden"
                        >
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                user.username?.charAt(0).toUpperCase() || 'J'
                            )}
                        </button>

                        {/* User Dropdown Menu */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-foreground font-medium text-sm">{user.username}</p>
                                    <p className="text-muted-foreground text-xs">{user.email}</p>
                                    <div className="mt-2 flex items-center gap-1 text-primary text-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold">{((user.balance || 0) / 100).toFixed(2)} ETB</span>
                                    </div>
                                </div>

                                <Link href="/history" className="block px-4 py-2 text-foreground hover:bg-secondary text-sm" onClick={() => setShowUserMenu(false)}>
                                    {t('myHistory')}
                                </Link>
                                <Link href="/my-deposits" className="block px-4 py-2 text-foreground hover:bg-secondary text-sm" onClick={() => setShowUserMenu(false)}>
                                    {t('myDeposits')}
                                </Link>
                                <Link href="/deposit" className="block px-4 py-2 text-foreground hover:bg-secondary text-sm" onClick={() => setShowUserMenu(false)}>
                                    {t('deposit')}
                                </Link>

                                {user?.roles?.includes('admin') && (
                                    <Link href="/admin" className="block px-4 py-2 text-blue-400 hover:bg-secondary text-sm" onClick={() => setShowUserMenu(false)}>
                                        {t('adminPanel')}
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-secondary text-sm border-t border-border"
                                >
                                    {t('logout')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
