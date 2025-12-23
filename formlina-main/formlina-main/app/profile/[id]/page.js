"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [playingVoice, setPlayingVoice] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/profiles`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const found = result.data.find((p) => p._id === id);
          console.log("Profile fetched:", found);
          setProfile(found);
        }
      })
      .catch((error) => console.error("Fetch error:", error));
  }, [id]);

  const toggleVoice = () => {
    const audio = document.getElementById(`audio-${id}`);
    if (playingVoice) {
      audio.pause();
      setPlayingVoice(false);
    } else {
      audio.play();
      setPlayingVoice(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("1000404416198"); // Replace with your bank account number
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center text-white text-xl">Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 py-8 px-4 sm:px-6 lg:px-12"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-indigo-900">{profile.name}</h1>
          <button
            onClick={toggleVoice}
            className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-all duration-300"
          >
            {playingVoice ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
        <motion.img 
          src={profile.photoUrl} 
          alt={profile.name} 
          className="w-full h-48 object-cover rounded-t-3xl" 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <audio id={`audio-${id}`} src="/audio/voice1.mp3" />
        <div className="mt-4">
          <p className="text-sm text-gray-700">Country: {profile.country}</p>
          <p className="text-sm text-gray-700">City: {profile.city || "N/A"}</p>
          <p className="text-sm text-gray-700">Neighborhood: {profile.neighborhood || "N/A"}</p>
          {profile.isUnlocked ? (
            <div>
              <p className="text-sm text-gray-700">Contact: {profile.contactInfo}</p>
              <motion.a
                href="https://t.me/linumar" // Replace with your Telegram link
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block py-1 px-3 bg-teal-500 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-teal-600 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
              >
                Telegram
              </motion.a>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-700">This profile is locked. Please unlock it first.</p>
          )}
        </div>
      </motion.div>
      <motion.div 
        className="max-w-md mx-auto text-center mt-8" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, delay: 0.5 }}
      >
        <p className="text-xl sm:text-2xl text-gray-900 font-semibold bg-white bg-opacity-90 p-6 rounded-xl shadow-lg leading-relaxed">
          አገልግሎት ለማግኘት ኮሚሽን በ CBE ይክፈሉ በመቀጠል Unlock የሚለውን Click ያድርጉ ከዛም የከፈሉበትን ደረሰኝ (Screenshot) ያስገቡ ሊና Team ወዲያው ሙሉ መረጃ ይከፍትሎታል and for more information talk to us on{" "}
          <motion.a
            href="https://t.me/linumar" // Replace with your Telegram link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-1 px-4 bg-teal-500 text-white rounded-full text-sm sm:text-base font-medium hover:bg-teal-600 transition-all duration-300"
            whileHover={{ scale: 1.1 }}
          >
            Telegram
          </motion.a>
        </p>
        <motion.div 
          className="inline-flex items-center bg-white text-black font-bold text-2xl sm:text-3xl mt-6 p-4 rounded-xl shadow-xl" 
          initial={{ scale: 0.9 }} 
          animate={{ scale: 1 }} 
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span>Bank Account: 1000404416198</span>
          <button
            onClick={copyToClipboard}
            className="ml-2 p-1 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-all duration-300"
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}