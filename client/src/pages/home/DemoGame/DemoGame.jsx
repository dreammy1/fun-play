import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useGetGamesQuery } from "@/redux/features/allApis/gameApi/gameApi";
import { useLazyGetUserByIdQuery } from "@/redux/features/allApis/usersApi/usersApi";

const DemoGame = () => {
  const { id } = useParams();
  const {
    data: games,
    isLoading: isGamesLoading,
    isError: isGamesError,
  } = useGetGamesQuery();
  const { user } = useSelector((state) => state.auth);
  const [gameLink, setGameLink] = useState(null);
  const [error, setError] = useState(null);
  const [orientation, setOrientation] = useState("landscape");
  const [isUserDataFetched, setIsUserDataFetched] = useState(false);
  const [isGameLinkFetched, setIsGameLinkFetched] = useState(false);
  // Removed conditional loader states; using only a fixed intro loader
  const [introLoading, setIntroLoading] = useState(true); // unconditional 2s intro loader
  const [showSpinner, setShowSpinner] = useState(false); // backend-controlled visual (default to text until fetched)
  const videoRef = useRef(null);

  // Remove selectedGame logic for gameID, use game_uuid from backend
  const [gameUUID, setGameUUID] = useState(null);

  const [triggerGetUserById, { data: userData, isError: isUserError }] =
    useLazyGetUserByIdQuery();

  // (Removed conditional iframe loader checks and logging; using simple intro loader instead)

  // Simple 2s intro loader regardless of other conditions
  useEffect(() => {
    const timer = setTimeout(() => setIntroLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch loader visual preference from backend
  useEffect(() => {
    const fetchLoaderConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/loader-config`, { cache: "no-store" });
        const data = await res.json();
        setShowSpinner(Boolean(data?.loader));
      } catch {
        setShowSpinner(true);
      }
    };
    fetchLoaderConfig();
  }, []);

  // Auto set orientation based on screen width
  // useEffect(() => {
  //   const updateOrientation = () => {
  //     const width = window.innerWidth;
  //     if (width < 768) {
  //       setOrientation("portrait");
  //     } else if (width < 1024) {
  //       setOrientation("rotate");
  //     } else {
  //       setOrientation("landscape");
  //     }
  //   };

  //   updateOrientation();
  //   window.addEventListener("resize", updateOrientation);
  //   return () => window.removeEventListener("resize", updateOrientation);
  // }, []);

  // Fetch user data when user is available
  useEffect(() => {
    if (user?._id) {
      console.log("Fetching user data for ID:", user._id);
      triggerGetUserById(user._id);
    }
  }, [user, triggerGetUserById]);

  // Update user data fetch status
  useEffect(() => {
    setIsUserDataFetched(true);
  }, [userData]);

  // Fetch game_uuid from backend using id param
  useEffect(() => {
    const fetchGameUUID = async () => {
      if (!id) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/premium/${id}`
        );
        const data = await res.json();
        if (data.success && data.game_uuid) {
          setGameUUID(data.game_uuid);
        } else {
          setError("Game UUID not found");
        }
      } catch {
        setError("Failed to fetch game UUID");
      }
    };
    fetchGameUUID();
  }, [id]);

  // Fetch game link when userData and gameUUID are available
  useEffect(() => {
    console.log("this is fetch ");

    const fetchGameLink = async () => {
      if (!gameUUID || !userData) return;
      setError(null);
      try {
        console.log("this is inside ");

        const response = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/getGameLink`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              gameID: gameUUID,
              money: parseInt(userData?.balance || 0, 10),
              username: user?.username,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch game link");
        }
        const data = await response.json();

        console.log(data);

        const link = data?.joyhobeResponse;
        if (link) {
          setGameLink(link);
        } else {
          throw new Error("Game link not found in response");
        }
      } catch (error) {
        console.error("Error fetching game link:", error);
        setError(error.message);
      } finally {
        setIsGameLinkFetched(true);
      }
    };
    if (gameUUID && userData) {
      fetchGameLink();
    }
  }, [gameUUID, userData, user]);

  // (Removed cross-origin loader probing; no conditional loader logic)

  // Show loading state while games are being fetched
  if (isGamesLoading) {
    return (
      <div className="loader-container fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white to-gray-100 z-50">
        {showSpinner ? (
          <div className="flex flex-col items-center justify-center">
            <div className="loader relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 animate-bounce">
              Loading Game
            </h2>
            <p className="text-lg font-semibold text-blue-600">
              www.oracleapi.net
            </p>
            <p className="mt-2 text-lg font-semibold text-blue-600">
              গেম লোড হচ্ছে অপেক্ষা করুন...
            </p>
          </div>
        ) : (
          <div className="text-gray-700 text-lg font-semibold">Loading...</div>
        )}
        <style>
          {`
          .animate-spin-slow {
            animation: spin 2s linear infinite;
          }

          .animate-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .animate-bounce {
            animation: bounce 2s ease-in-out infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 0.9; }
            100% { transform: scale(1); opacity: 0.7; }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
        </style>
      </div>
    );
  }

  // Show error if games fetch failed
  if (isGamesError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-[100vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-md">
          <p className="font-semibold">গেম ডেটা লোড করতে ব্যর্থ হয়েছে!</p>
          <p className="text-sm">দয়া করে পরে আবার চেষ্টা করুন।</p>
        </div>
      </div>
    );
  }

  // Show "Game not found" error only after games are loaded
  // (We don't need selectedGame anymore, so just check for error)
  if (error && !isGameLinkFetched) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-[100vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-md">
          <p className="font-semibold">গেম পাওয়া যায়নি!</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show error only after user data or game link fetch fails
  if ((isUserError && isUserDataFetched) || (error && isGameLinkFetched)) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-[100vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-md">
          <p className="font-semibold">একটি ত্রুটি ঘটেছে!</p>
          <p className="text-sm">{error || "Failed to fetch user data"}</p>
        </div>
      </div>
    );
  }

  // Show "Game link not found" warning only after game link fetch is complete
  if (!gameLink && isGameLinkFetched) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-[100vh]">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md shadow-md">
          <p className="font-semibold">গেম লিঙ্ক পাওয়া যায়নি!</p>
          <p className="text-sm">দয়া করে পরে আবার চেষ্টা করুন।</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${
        orientation === "portrait"
          ? "h-[100vh]"
          : orientation === "rotate"
          ? "h-[80vh]"
          : "h-[650px]"
      } bg-white overflow-hidden`}
    >
      {/* Inline CSS for Loaders */}

      {/* Iframe */}
      <iframe
        ref={videoRef}
        className="w-full h-full fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white to-gray-100 z-50"
        src={gameLink}
        frameBorder="0"
        title={id}
        allowFullScreen
      ></iframe>

      {/* Professional Loading Overlay */}
      {introLoading && (
        <div className="loader-container fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white to-gray-100 z-50">
          {showSpinner ? (
            <div className="flex flex-col items-center justify-center">
              <div className="loader relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 animate-bounce">
                Loading Game
              </h2>
              <p className="text-lg font-semibold text-blue-600">
                www.oracleapi.net
              </p>
              <p className="mt-2 text-lg font-semibold text-blue-600">
                গেম লোড হচ্ছে অপেক্ষা করুন...
              </p>
            </div>
          ) : (
            <div className="text-gray-700 text-lg font-semibold">Loading...</div>
          )}
          <style>
            {`
          .animate-spin-slow {
            animation: spin 2s linear infinite;
          }

          .animate-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .animate-bounce {
            animation: bounce 2s ease-in-out infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 0.9; }
            100% { transform: scale(1); opacity: 0.7; }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
          </style>
        </div>
      )}
    </div>
  );
};

export default DemoGame;
