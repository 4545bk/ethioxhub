'use client';

import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AtlassHeader = () => {
    const { user } = useAuth();

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2.5 w-80">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search analytics..."
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                />
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-semibold">
                            {getInitials(user?.username || 'Admin')}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-primary">Administrator</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </header>
    );
};

export default AtlassHeader;
