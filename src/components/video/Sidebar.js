import { Home, CreditCard, Video, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = ({ user }) => {
    const pathname = usePathname();

    const topMenuItems = [
        {
            icon: Home,
            href: "/",
            label: "Home",
            active: pathname === "/"
        },
        {
            icon: Video,
            href: "/categories",
            label: "Categories",
            active: pathname?.startsWith("/categories") || pathname?.startsWith("/videos")
        },
        {
            icon: CreditCard,
            href: "/pricing",
            label: "Subscribe",
            active: pathname === "/pricing"
        },
    ];

    const bottomMenuItems = [
        {
            icon: Settings,
            href: "/admin",
            label: "Settings",
            active: pathname?.startsWith("/admin"),
            adminOnly: true
        },
    ];

    return (
        <div className="w-20 bg-card flex flex-col items-center py-6 gap-2 border-r border-border shrink-0 hidden md:flex">
            {/* Logo */}
            <Link href="/" className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mb-6 hover:bg-primary/90 transition-colors">
                <span className="text-primary-foreground font-bold text-lg">J</span>
            </Link>

            {/* Top Menu */}
            <div className="flex flex-col gap-2">
                {topMenuItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        title={item.label}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${item.active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                    </Link>
                ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Menu - Only Settings now */}
            <div className="flex flex-col gap-2">
                {bottomMenuItems.map((item, index) => {
                    // Hide admin-only items if user is not admin
                    if (item.adminOnly && !user?.roles?.includes('admin')) {
                        return null;
                    }

                    return (
                        <Link
                            key={index}
                            href={item.href}
                            title={item.label}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${item.active
                                ? 'bg-secondary text-foreground'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
