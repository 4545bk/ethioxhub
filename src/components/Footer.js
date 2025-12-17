'use client';

import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();

    const informationLinks = [
        "Sitemap",
        "Terms & Conditions",
        "Privacy Notice",
        "DMCA",
        "2257",
        "EU DSA",
        "Recommender System Guidelines",
        "Cookie Notice",
        "Accessibility",
        "Notice to Law Enforcement",
    ];

    const workWithUsLinks = [
        "Content Partners",
        "Advertise",
        "Webmasters",
        "Model Program",
        "Press",
    ];

    const supportLinks = [
        "Content Removal",
        "Contact Support",
        "FAQ",
        "Trust and Safety",
        "Parental Controls",
        "Manage Cookies",
    ];

    const discoverLinks = [
        "Blog",
        "Insights Blog",
        "Wellness Center",
        "Mobile",
        "Visually Impaired",
        "Audio Impaired",
    ];

    return (
        <footer className="w-full bg-footer-bg text-foreground border-t border-footer-border mt-auto">
            {/* Top description section */}
            <div className="border-b border-footer-border">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <p className="text-center text-muted-foreground text-sm leading-relaxed">
                        {t('footerDescription')}
                    </p>
                </div>
            </div>

            {/* Main footer links */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Information Column */}
                    <div>
                        <h3 className="text-foreground font-medium mb-4 text-sm">{t('information')}</h3>
                        <ul className="space-y-2">
                            {informationLinks.map((link) => (
                                <li key={link}>
                                    <a
                                        href="#"
                                        className="text-link-orange text-sm hover:underline transition-all duration-200"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Work With Us Column */}
                    <div>
                        <h3 className="text-foreground font-medium mb-4 text-sm">{t('workWithUs')}</h3>
                        <ul className="space-y-2">
                            {workWithUsLinks.map((link) => (
                                <li key={link}>
                                    <a
                                        href="#"
                                        className="text-link-orange text-sm hover:underline transition-all duration-200"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-foreground font-medium mb-4 text-sm">{t('support')}</h3>
                        <ul className="space-y-2">
                            {supportLinks.map((link) => (
                                <li key={link}>
                                    <a
                                        href="#"
                                        className="text-link-orange text-sm hover:underline transition-all duration-200"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Discover Column */}
                    <div>
                        <h3 className="text-foreground font-medium mb-4 text-sm">{t('discover')}</h3>
                        <ul className="space-y-2">
                            {discoverLinks.map((link) => (
                                <li key={link}>
                                    <a
                                        href="#"
                                        className="text-link-orange text-sm hover:underline transition-all duration-200"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Language Selector */}
                <div className="mt-8 flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Language:</span>
                    <button className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded text-sm text-foreground hover:bg-muted transition-colors">
                        <Globe className="w-4 h-4" />
                        <span>English</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Bottom copyright section */}
            <div className="border-t border-footer-border bg-background">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <a href="https://ethioxhub.vercel.app/" className="text-muted-foreground text-sm hover:underline">© ethioxhub.vercel.app</a>
                        <div className="flex items-center gap-4">
                            <span className="text-foreground font-bold text-xl tracking-wider">RTA</span>
                            <button className="bg-link-orange text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition-opacity">
                                Notice to Users
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
