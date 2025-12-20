'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Users, Video, DollarSign, Settings, Calendar } from 'lucide-react';

const AtlassSidebar = () => {
    const pathname = usePathname();

    const mainNav = [
        { icon: Home, label: 'Dashboard', href: '/admin', active: pathname === '/admin' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', active: pathname === '/admin/analytics' },
    ];

    const reportsNav = [
        { icon: Users, label: 'Users', href: '/admin/users', active: pathname === '/admin/users' },
        { icon: Video, label: 'Videos', href: '/admin/videos', active: pathname === '/admin/videos' },
        { icon: DollarSign, label: 'Deposits', href: '/admin/deposits', active: pathname === '/admin/deposits' },
    ];

    const generalNav = [
        { icon: Settings, label: 'Settings', href: '/admin/settings', active: pathname === '/admin/settings' },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold text-foreground">EthioxHub</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
                {/* Main Nav */}
                <div className="space-y-1">
                    {mainNav.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors cursor-pointer ${item.active ? 'bg-primary/10 text-primary font-medium' : ''
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Reports Section */}
                <div>
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Management
                    </p>
                    <div className="space-y-1">
                        {reportsNav.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors cursor-pointer ${item.active ? 'bg-primary/10 text-primary font-medium' : ''
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* General Section */}
                <div>
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        General
                    </p>
                    <div className="space-y-1">
                        {generalNav.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors cursor-pointer ${item.active ? 'bg-primary/10 text-primary font-medium' : ''
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Stats Card */}
            <div className="p-4">
                <div className="bg-primary rounded-xl p-4 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Analytics</p>
                            <p className="text-xs opacity-80">LAST 7 DAYS</p>
                        </div>
                    </div>
                    <p className="text-accent text-xs font-semibold mt-2">
                        REAL-TIME TRACKING
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AtlassSidebar;
