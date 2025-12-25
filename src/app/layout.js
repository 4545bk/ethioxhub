import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Footer from '@/components/Footer';
import ReferralTracker from '@/components/ReferralTracker';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import SignupPromptModal from '@/components/SignupPromptModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  metadataBase: new URL('https://ethioxhub.vercel.app'),
  title: {
    default: 'EthioxHub - Premium Ethiopian Video Streaming Platform',
    template: '%s | EthioxHub',
  },
  description: 'Stream exclusive Ethiopian movies, music videos, and VIP content. Join EthioxHub for the best premium entertainment experience.',
  keywords: ['Ethiopian movies', 'EthioxHub', 'Ethiopian music', 'Amharic videos', 'premium streaming', 'VIP content', 'Ethiopia'],
  authors: [{ name: 'EthioxHub Team' }],
  creator: 'EthioxHub',
  publisher: 'EthioxHub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: 'https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png' },
    ],
    shortcut: ['https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png'],
    apple: ['https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png'],
  },
  openGraph: {
    title: 'EthioxHub - Premium Ethiopian Video Streaming',
    description: 'Stream exclusive Ethiopian movies, music videos, and VIP content.',
    url: 'https://ethioxhub.vercel.app',
    siteName: 'EthioxHub',
    images: [
      {
        url: 'https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png',
        width: 800,
        height: 600,
        alt: 'EthioxHub Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EthioxHub - Premium Streaming',
    description: 'Stream exclusive Ethiopian movies and VIP content.',
    images: ['https://res.cloudinary.com/dyztnlzzt/image/upload/v1765613142/ethioxhub_thumbnails/naygoircaypdcaijxsgf.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token', // You can ask user to add this later
    other: {
      'juicyads-site-verification': ['9a0d458b1acb2648334dcf010b29bfac'],
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <NotificationProvider>
                <Suspense fallback={null}>
                  <ReferralTracker />
                  <AnalyticsTracker />
                  <SignupPromptModal />
                </Suspense>

                {/* JSON-LD Structured Data */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'WebSite',
                      name: 'EthioxHub',
                      url: 'https://ethioxhub.vercel.app',
                      potentialAction: {
                        '@type': 'SearchAction',
                        target: 'https://ethioxhub.vercel.app/?search={search_term_string}',
                        'query-input': 'required name=search_term_string',
                      },
                    }),
                  }}
                />

                {children}
                <Footer />
              </NotificationProvider>
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
