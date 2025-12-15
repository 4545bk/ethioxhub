import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Footer from '@/components/Footer';
import ReferralTracker from '@/components/ReferralTracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'EthioxHub - Premium Video Streaming',
  description: 'Stream exclusive VIP content and discover amazing videos',
  icons: {
    icon: 'https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            {children}
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
