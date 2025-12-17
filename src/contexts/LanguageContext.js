'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        // Navigation & Common
        home: "Home",
        categories: "Categories",
        subscribe: "Subscribe",
        settings: "Settings",
        login: "Login",
        register: "Register",
        logout: "Logout",
        search: "Search",
        myProfile: "My Profile",
        myHistory: "My History",
        myDeposits: "My Deposits",
        adminPanel: "Admin Panel",
        notifications: "Notifications",
        share: "Share",
        copied: "Copied!",
        balance: "Balance",
        language: "Language",
        english: "English",
        amharic: "Amharic",

        // Homepage
        hotCourseVideos: "Hot Videos in Ethiopia 🇪🇹",
        all: "All",
        continueWatching: "Continue Watching",
        noVideosFound: "No videos found",
        tryDifferentFilters: "Try adjusting your filters or search term",
        resetFilters: "Reset Filters",
        showingResults: "Showing",
        of: "of",
        results: "results",
        page: "Page",
        previous: "Previous",
        next: "Next",

        // Video Details
        watch: "Watch",
        views: "views",
        likes: "likes",
        streaming: "streaming",
        description: "Description",
        relatedVideos: "Related Videos",
        seeAll: "See All",
        price: "Price",
        free: "Free",
        premium: "Premium",
        buy: "Buy Now",
        purchased: "Purchased",
        like: "Like",
        liked: "Liked",
        dislike: "Dislike",
        subscribers: "subscribers",

        // Auth Pages
        welcomeBack: "Welcome Back",
        signInToContinue: "Sign in to continue to EthioxHub",
        email: "Email",
        password: "Password",
        signingIn: "Signing in...",
        signIn: "Sign In",
        orContinueWith: "or continue with",
        dontHaveAccount: "Don't have an account?",
        signUp: "Sign up",
        createAccount: "Create Account",
        joinEthioxHub: "Join EthioxHub today",
        username: "Username",
        confirmPassword: "Confirm Password",
        mustBeAtLeast: "Must be at least 8 characters",
        creatingAccount: "Creating account...",
        alreadyHaveAccount: "Already have an account?",

        // Deposit & Financial
        deposit: "Deposit Funds",
        amount: "Amount",
        submit: "Submit",
        cancel: "Cancel",
        depositFunds: "Deposit Funds",
        yourBalance: "Your Balance",
        enterAmount: "Enter amount to deposit",
        uploadScreenshot: "Upload Screenshot",
        senderName: "Sender Name",
        optional: "Optional",
        transactionCode: "Transaction Code",
        phoneNumber: "Phone Number",
        yourDeposits: "Your Deposits",
        status: "Status",
        date: "Date",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        paymentScreenshot: "Payment Screenshot",
        amountEtb: "Amount (ETB)",
        clickToUpload: "Click to upload screenshot",
        submitDeposit: "Submit Deposit",
        bankAccounts: "Bank Accounts",
        cbe: "CBE",
        commercialBank: "Commercial Bank of Ethiopia",
        telebirr: "Telebirr",
        mobileMoney: "Mobile Money",
        copyAccount: "Copy Account Number",
        copyPhone: "Copy Number",
        ensureTransaction: "Please ensure you enter your transaction code correctly in the form for faster approval.",
        location: "Location",
        copiedAccount: "Copied account number!",
        copiedPhone: "Copied phone number!",

        // Footer
        footerDescription: "Your platform provides you with unlimited free content with the best creators. Enjoy the largest community on the net as well as full-length scenes from the top studios. We update our content daily to ensure you always get the best quality experience.",
        information: "Information",
        workWithUs: "Work With Us",
        support: "Support",
        discover: "Discover",
        language: "Language",
        madeWithLove: "Made with ❤️ in Ethiopia",
        allRightsReserved: "All Rights Reserved",

        // Comments
        comments: "Comments",
        writeComment: "Write a comment...",
        post: "Post",
        reply: "Reply",
        delete: "Delete",
        replying: "Replying to",
        noComments: "No comments yet",
        beFirst: "Be the first to comment!",

        // Modals
        purchaseVideo: "Purchase Video",
        subscribeNow: "Subscribe Now",
        unlimitedAccess: "Get unlimited access to all VIP content",
        perMonth: "per month",
        confirmPurchase: "Confirm Purchase",
        insufficientBalance: "Insufficient Balance",
        pleaseDeposit: "Please deposit funds to continue",

        // Messages
        loading: "Loading...",
        processing: "Processing...",
        success: "Success!",
        error: "Error",
        tryAgain: "Try Again",
        noResults: "No results found",

        // Misc
        upload: "Upload",
        download: "Download",
        report: "Report",
        savePlaylist: "Save to Playlist",
        quality: "Quality",
        auto: "Auto",
        duration: "Duration",
        uploadedBy: "Uploaded by",
        on: "on",
    },
    am: {
        // Navigation & Common
        home: "መነሻ",
        categories: "ምድቦች",
        subscribe: "ይመዝገቡ",
        settings: "ቅንብሮች",
        login: "ይግቡ",
        register: "ይመዝገቡ",
        logout: "ውጣ",
        search: "ፈልግ",
        myProfile: "የግል ገጽ",
        myHistory: "ታሪክ",
        myDeposits: "ተቀማጭ ገንዘብ",
        adminPanel: "አስተዳዳሪ",
        notifications: "ማሳወቂያዎች",
        share: "ያጋሩ",
        copied: "ተቀድቷል!",
        balance: "ቀሪ ሂሳብ",
        language: "ቋንቋ",
        english: "እንግሊዝኛ",
        amharic: "አማርኛ",

        // Homepage
        hotCourseVideos: "የኢትዮጵያ 🇪🇹",
        all: "ሁሉም",
        continueWatching: "መመልከት ቀጥል",
        noVideosFound: "ምንም ቪዲዮዎች አልተገኙም",
        tryDifferentFilters: "ማጣሪያዎችን ወይም የፍለጋ ቃልዎን ያስተካክሉ",
        resetFilters: "ማጣሪያዎችን ዳግም አስጀምር",
        showingResults: "በማሳየት ላይ",
        of: "ከ",
        results: "ውጤቶች",
        page: "ገጽ",
        previous: "ቀዳሚ",
        next: "ቀጣይ",

        // Video Details
        watch: "ተመልከት",
        views: "እይታዎች",
        likes: "መውደዶች",
        streaming: "በመስመር ላይ",
        description: "መግለጫ",
        relatedVideos: "ተዛማጅ ቪዲዮዎች",
        seeAll: "ሁሉንም ይመልከቱ",
        price: "ዋጋ",
        free: "ነፃ",
        premium: "ፕሪሚየም",
        buy: "አሁን ይግዙ",
        purchased: "ተገዝቷል",
        like: "አውደው",
        liked: "ተውዷል",
        dislike: "አላውደውም",
        subscribers: "ተመዝጋቢዎች",

        // Auth Pages
        welcomeBack: "እንኳን ደህና መለሱ",
        signInToContinue: "ወደ EthioxHub ለመቀጠል ይግቡ",
        email: "ኢሜይል",
        password: "የይለፍ ቃል",
        signingIn: "በመግባት ላይ...",
        signIn: "ግባ",
        orContinueWith: "ወይም ቀጥል በ",
        dontHaveAccount: "መለያ የለህም?",
        signUp: "ይመዝገቡ",
        createAccount: "መለያ ፍጠር",
        joinEthioxHub: "ዛሬ EthioxHub ላይ ይቀላቀሉ",
        username: "የተጠቃሚ ስም",
        confirmPassword: "የይለፍ ቃል ያረጋግጡ",
        mustBeAtLeast: "ቢያንስ 8 ቁምፊዎች መሆን አለበት",
        creatingAccount: "መለያ በመፍጠር ላይ...",
        alreadyHaveAccount: "መለያ አለህ?",

        // Deposit & Financial
        deposit: "ገንዘብ ያስገቡ",
        amount: "መጠን",
        submit: "አስገባ",
        cancel: "ሰርዝ",
        depositFunds: "ገንዘብ አስገባ",
        yourBalance: "የእርስዎ ቀሪ ሂሳብ",
        enterAmount: "ለማስገባት መጠን ያስገቡ",
        uploadScreenshot: "ገጽ እይታ ይጫኑ",
        senderName: "የላኪ ስም",
        optional: "አማራጭ",
        transactionCode: "የግብይት ኮድ",
        phoneNumber: "ስልክ ቁጥር",
        yourDeposits: "የእርስዎ ተቀማጮች",
        status: "ሁኔታ",
        date: "ቀን",
        pending: "በመጠባበቅ ላይ",
        approved: "ጸድቋል",
        rejected: "ተቀባይነት አላገኘም",
        paymentScreenshot: "የክፍያ ስክሪንሾት",
        amountEtb: "መጠን (ETB)",
        clickToUpload: "ስክሪንሾት ለመጫን እዚህ ይጫኑ",
        submitDeposit: "ተቀማጭ ያስገቡ",
        bankAccounts: "የባንክ ሂሳቦች",
        cbe: "የኢትዮጵያ ንግድ ባንክ",
        commercialBank: "የኢትዮጵያ ንግድ ባንክ",
        telebirr: "ቴሌብር",
        mobileMoney: "የሞባይል ገንዘብ",
        copyAccount: "የሂሳብ ቁጥር ገልብጥ",
        copyPhone: "ቁጥር ገልብጥ",
        ensureTransaction: "እባክዎ ለፈጣን ማረጋገጫ የግብይት ኮድዎን በትክክል ማስገባትዎን ያረጋግጡ።",
        location: "ቦታ",
        copiedAccount: "የሂሳብ ቁጥሩ ተቀድቷል!",
        copiedPhone: "ስልክ ቁጥሩ ተቀድቷል!",

        // Footer
        footerDescription: "የእርስዎ መድረክ ከምርጥ ፈጣሪዎች ጋር ያልተገደበ ነፃ ይዘትን ይሰጥዎታል። በድሩ ላይ ትልቁን ማህበረሰብ እንዲሁም ከከፍተኛ ስቱዲዮዎች ሙሉ ርዝመት ያሉ ትዕይንቶችን ይደሰቱ። ሁልጊዜ ምርጡን የጥራት ተሞክሮ እንዲያገኙ ይዘታችንን በየቀኑ እናዘምናለን።",
        information: "መረጃ",
        workWithUs: "ከእኛ ጋር ይስሩ",
        support: "ድጋፍ",
        discover: "አግኝ",
        language: "ቋንቋ",
        madeWithLove: "በኢትዮጵያ በፍቅር የተሰራ ❤️",
        allRightsReserved: "መብቱ በህግ የተጠበቀ ነው",

        // Comments
        comments: "አስተያየቶች",
        writeComment: "አስተያየት ይጻፉ...",
        post: "ለጥፍ",
        reply: "መልስ",
        delete: "ሰርዝ",
        replying: "መልስ እየሰጡ ለ",
        noComments: "እስካሁን ምንም አስተያየቶች የሉም",
        beFirst: "የመጀመሪያው አስተያየት ሰጪ ይሁኑ!",

        // Modals
        purchaseVideo: "ቪዲዮ ይግዙ",
        subscribeNow: "አሁን ይመዝገቡ",
        unlimitedAccess: "ለሁሉም VIP ይዘት ያልተገደበ መዳረሻ ያግኙ",
        perMonth: "በወር",
        confirmPurchase: "ግዢውን ያረጋግጡ",
        insufficientBalance: "በቂ ሂሳብ የለም",
        pleaseDeposit: "ለመቀጠል ገንዘብ ያስገቡ",

        // Messages
        loading: "በመጫን ላይ...",
        processing: "በማስኬድ ላይ...",
        success: "ተሳክቷል!",
        error: "ስህተት",
        tryAgain: "እንደገና ይሞክሩ",
        noResults: "ምንም ውጤት አልተገኘም",

        // Misc
        upload: "ይጫኑ",
        download: "አውርድ",
        report: "ሪፖርት አድርግ",
        savePlaylist: "በፕሌይሊስት ውስጥ አስቀምጥ",
        quality: "ጥራት",
        auto: "ራስ-ሰር",
        duration: "ርዝመት",
        uploadedBy: "የተጫነ በ",
        on: "በ",
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'am' : 'en';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = (key) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
