"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function HomeClient() {
  const { data: session, status } = useSession();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      fetchProfiles();
    }
  }, [status]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles?ts=" + Date.now());
      if (!res.ok) throw new Error(`Failed to fetch profiles: ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        console.log("Profiles fetched:", result.data);
        setProfiles(result.data);
      } else {
        setError(result.error || "Invalid profiles data");
        setProfiles([]);
      }
    } catch (error) {
      console.error("Fetch profiles error:", error);
      setError(error.message || "Something went wrong. Please try again.");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockClick = (profileId) => {
    if (status === "unauthenticated") {
      signIn(); // Redirects to /auth/signin as per authOptions
      return;
    }
    setSelectedProfile(profileId);
    setScreenshot(null);
  };

  const handleUnlockSubmit = async (profileId) => {
    if (!screenshot) {
      alert("Please upload a payment receipt.");
      return;
    }

    const formData = new FormData();
    formData.append("profileId", profileId);
    formData.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/unlock", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        setSelectedProfile(null);
        setScreenshot(null);
        fetchProfiles();
        setTimeout(fetchProfiles, 5000);
      } else {
        alert("Error: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Submission failed: " + error.message);
    }
  };

  const toggleVoice = (profileId) => {
    const audio = document.getElementById(`audio-${profileId}`);
    if (playingVoice === profileId) {
      audio.pause();
      setPlayingVoice(null);
    } else {
      if (playingVoice) {
        const prevAudio = document.getElementById(`audio-${playingVoice}`);
        prevAudio.pause();
      }
      audio.play();
      setPlayingVoice(profileId);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("1000404416198");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {status === "loading" || loading ? (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 flex items-center justify-center">
          <div className="loader animate-loader">
            <span className="text-white text-2xl sm:text-3xl font-extrabold tracking-wider">
              Lina Agency
            </span>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-800 to-teal-600 py-8 px-4 sm:px-6 lg:px-12">
          <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg animate-slide-in">
              Lina Girls Profiles
            </h1>
            <div className="mt-4 sm:mt-0">
              {session ? (
                <button
                  onClick={() => signOut()}
                  className="py-2 px-6 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="py-2 px-6 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          <div className="max-w-7xl mx-auto text-center mb-8">
            <p className="text-white text-base sm:text-lg leading-relaxed mb-4">
              አገልግሎት ለማግኘት ኮሚሽን በ CBE ይክፈሉ በመቀጠል Unlock የሚለውን Click ያድርጉ ከዛም የከፈሉበትን ደረሰኝ (Screenshot) ያስገቡ ሊና Team ወዲያው ሙሉ መረጃ ይከፍትሎታል and for more information talk to us on telegram{" "}
              <a
                href="https://t.me/linumar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1 px-3 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition-all duration-300"
              >
                Telegram
              </a>
            </p>
            <div className="inline-flex items-center bg-white text-black font-bold text-xl sm:text-2xl py-2 px-4 rounded-lg shadow-md">
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
            </div>
          </div>

          {error && (
            <div className="text-center text-white mb-10 animate-slide-in">
              <p className="text-lg sm:text-xl font-light">{error}</p>
              <button
                onClick={fetchProfiles}
                className="mt-4 py-2 px-6 bg-teal-600 text-white rounded-full font-medium shadow-lg hover:bg-teal-700 transition-all duration-300 transform hover:scale-105"
              >
                Retry
              </button>
            </div>
          )}

          {profiles.length === 0 ? (
            <p className="text-white text-center text-lg sm:text-xl font-light animate-slide-in">
              No profiles available yet.
            </p>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {profiles.map((profile) => (
                <div
                  key={profile._id || Math.random()}
                  className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-3"
                >
                  <div className="relative w-full h-80 sm:h-96">
                    <img
                      src={profile.photoUrl || "/placeholder.jpg"}
                      alt={profile.name || "Profile"}
                      className={`w-full h-full object-cover ${
                        !profile.isUnlocked ? "blur-lg opacity-70" : ""
                      }`}
                      loading="lazy"
                    />
                    {profile.isPending && (
                      <div className="pending-overlay animate-pulse">
                        <div className="flex flex-col items-center text-white">
                          <div className="pending-circle">
                            <svg
                              className="pending-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6v6l4 2"
                              />
                            </svg>
                          </div>
                          <p className="pending-text">Awaiting Approval</p>
                        </div>
                      </div>
                    )}
                    {profile.isRejected && (
                      <div className="rejected-overlay">
                        <div className="flex flex-col items-center text-white">
                          <svg
                            className="rejected-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <p className="rejected-text">Payment Rejected</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-semibold text-indigo-900 truncate animate-fade-in-up">
                        {profile.name || "Unknown"}
                      </h2>
                      <button
                        onClick={() => toggleVoice(profile._id)}
                        className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-all duration-300"
                      >
                        {playingVoice === profile._id ? (
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
                    <audio id={`audio-${profile._id}`} src="/audio/voice1.mp3" />
                    <p className="text-xs sm:text-sm text-gray-700 mt-1 animate-fade-in-up animation-delay-100">
                      {profile.age || "N/A"} yrs | {profile.city || "N/A"}, {profile.country || "N/A"}
                    </p>
                    {profile.neighborhood && (
                      <p className="text-xs sm:text-sm text-gray-600 animate-fade-in-up animation-delay-200">
                        Area: {profile.neighborhood}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-700 mt-1 animate-fade-in-up animation-delay-300">
                      Salary: {profile.localSalary ? "Local (5k-10k)" : ""}{" "}
                      {profile.localSalary && profile.intlSalary ? "|" : ""}{" "}
                      {profile.intlSalary ? "Intl (15k-20k)" : ""}
                    </p>
                    <div className="mt-1 animate-fade-in-up animation-delay-400">
                      <p className="text-xs sm:text-sm text-gray-700 truncate">
                        Contact: {profile.contactInfo || "N/A"}
                      </p>
                      <a
                        href="https://t.me/linumar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block py-1 px-3 bg-teal-500 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-teal-600 transition-all duration-300"
                      >
                        Telegram
                      </a>
                    </div>

                    {profile.additionalPhotos?.length > 0 && (
                      <div className="mt-3 flex space-x-2 overflow-x-auto scrollbar-hidden">
                        {profile.additionalPhotos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo || "/placeholder.jpg"}
                            alt={`Extra ${index + 1}`}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl shadow-md hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}

                    {!profile.isUnlocked && !profile.isPending && !profile.isRejected && (
                      <div className="mt-4 space-y-3">
                        {selectedProfile === profile._id ? (
                          <div className="space-y-3 animate-slide-in">
                            <label className="block text-xs sm:text-sm text-gray-700 font-medium">
                              Upload Payment Receipt
                              <div className="relative mt-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setScreenshot(e.target.files[0])}
                                  className="block w-full text-xs sm:text-sm text-gray-600 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-teal-100 file:text-teal-800 hover:file:bg-teal-200 transition-all duration-200"
                                />
                                <svg
                                  className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-800"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v4h16v-4M12 4v12m-4-4l4-4 4 4"
                                  />
                                </svg>
                              </div>
                            </label>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUnlockSubmit(profile._id)}
                                className="flex-1 py-1 px-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-md hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                              >
                                Submit ($1000)
                              </button>
                              <button
                                onClick={() => setSelectedProfile(null)}
                                className="flex-1 py-1 px-3 bg-gray-200 text-gray-800 rounded-full font-medium shadow-md hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUnlockClick(profile._id)}
                            className="w-full py-1 px-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full font-medium shadow-md hover:from-teal-600 hover:to-teal-800 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                          >
                            Unlock Profile
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}