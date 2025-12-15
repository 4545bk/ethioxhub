'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function GoogleLoginButton() {
    const { loginWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        /* global google */
        const initializeGoogle = () => {
            if (window.google) {
                // STRICTLY use environment variable only - NO FALLBACKS
                if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
                    console.error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
                    return;
                }

                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse
                });

                const target = document.getElementById("googleSignInDiv");
                if (target) {
                    window.google.accounts.id.renderButton(
                        target,
                        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
                    );
                }
            }
        };

        const loadGoogleScript = () => {
            if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
                initializeGoogle();
                return;
            }
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogle;
            document.body.appendChild(script);
        };

        const handleCredentialResponse = async (response) => {
            try {
                await loginWithGoogle(response.credential);
                router.push('/');
            } catch (err) {
                console.error("Google Login Error", err);
                alert("Google Login Failed: " + err.message);
            }
        };

        if (window.google) {
            initializeGoogle();
        } else {
            loadGoogleScript();
        }
    }, [loginWithGoogle, router]);

    return (
        <div className="w-full flex justify-center h-[40px] mb-4">
            {/* Container must have specific height to avoid layout shift */}
            <div id="googleSignInDiv" style={{ width: '100%' }}></div>
        </div>
    );
}
