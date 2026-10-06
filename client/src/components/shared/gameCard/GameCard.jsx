import { Link } from "react-router-dom";
import hotIcon from "@/assets/images/hot-icon.png";
import newIcon from "@/assets/images/game-icon-new.svg";
import { useSelector } from "react-redux";
import { useState } from "react";

const GameCard = ({
  gameCardImg,
  badge,
  gameHeading,
  gameText,
  headingCenter,
  demoId,
  gameLink,
  hot,
  isNew,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const user = useSelector((state) => state.auth?.user);
  const token = useSelector((state) => state.auth?.token);
  const userData = useSelector((state) => state.user?.data);
  const isLoading = useSelector((state) => state.user?.isLoading);
  const isError = useSelector((state) => state.user?.isError);

  // Determine badge: show 'hot' if hot, 'new' if new, else badge prop
  // Prefer hot/isNew props for badge, fallback to badge prop
  let displayBadge = "";
  if (hot) displayBadge = "hot";
  else if (isNew) displayBadge = "new";
  else if (badge && typeof badge === "string") displayBadge = badge;
  let displayCategory = gameText;
  if (gameText && typeof gameText === "object" && gameText.name) {
    displayCategory = gameText.name;
  }
  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (!user || !token) {
      setModalMessage("Please log in to continue accessing this feature.");
      setIsModalOpen(true);
    } else {
      if (demoId) {
        window.location.href = `/livegame/${demoId}`;
      }
    }
  };
  const handleCardClick = () => {
    if (!user || !token) {
      setModalMessage("Please log in to continue accessing this feature.");
      setIsModalOpen(true);
    } else if (isLoading) {
      setModalMessage("Loading user data, please wait...");
      setIsModalOpen(true);
    } else if (isError) {
      setModalMessage("Failed to fetch user data. Please try again.");
      setIsModalOpen(true);
    } else if (userData?.balance < 20) {
      setModalMessage("এই গেমটি খেলতে আপনার ব্যালান্স অন্তত ২০ থাকতে হবে।");
      setIsModalOpen(true);
    }
  };
  const backgroundColor = "#f3f4f6";
  const mainColor = "#1e293b";
  return (
    <div className="">
      <div className="relative group overflow-hidden" onClick={handleCardClick}>
        {(() => {
          const BASE = "https://apigames.oracleapi.net/api/";
          let rawPath = "";
          if (gameCardImg && typeof gameCardImg === "object") {
            const projectDocs = gameCardImg.projectImageDocs || [];
            const babuDoc = Array.isArray(projectDocs)
              ? projectDocs.find((d) => d?.projectName?.title === "Babu88")
              : null;
            rawPath = babuDoc?.image || gameCardImg.image || "";
          } else if (typeof gameCardImg === "string") {
            rawPath = gameCardImg || "";
          }

          if (!rawPath) {
            return null; // No image if not available
          }

          const isAbsolute = /^https?:\/\//i.test(rawPath);
          const src = isAbsolute ? rawPath : `${BASE}${rawPath}`;

          return (
            <img
              className="w-full h-28 sm:h-36 object-cover rounded-[20px] lg:rounded-xl"
              src={src}
              alt={gameHeading || "Game Image"}
            />
          );
        })()}
        <div className="absolute w-full h-full top-0 left-0 bg-white opacity-0 z-10 transition-opacity duration-300 group-hover:opacity-70 rounded-[20px] lg:rounded-xl"></div>
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 translate-y-16 opacity-0 transition-transform duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-20">
          <button onClick={handlePlayClick}>
            <img
              className="filter-none grayscale hover:filter w-12 h-12"
              src="https://www.babu88.app/static/svg/play_btn.svg"
              alt="Play Button"
            />
          </button>
          {user && token && demoId && (
            <button
              onClick={handlePlayClick}
              style={{ display: "none" }}
              className="text-white px-2 py-1 rounded-full bg-slate-900 mt-2 text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Demo
            </button>
          )}
        </div>
        <img
          className="absolute top-1 right-1 w-7 md:w-10"
          src={
            displayBadge === "new"
              ? newIcon
              : displayBadge === "hot"
              ? hotIcon
              : ""
          }
          alt={displayBadge ? `${displayBadge} badge` : ""}
        />
      </div>
      <div className="hidden md:block">
        <h2
          className={`${
            headingCenter ? "text-center" : "text-start"
          } text-lg font-semibold text-gray-800`}
        >
          {typeof gameHeading === "object" && gameHeading.name
            ? gameHeading.name
            : gameHeading}
        </h2>
        <p className="mt-1 text-xs font-semibold text-gray-600">
          {displayCategory}
        </p>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-10/12 max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {modalMessage.includes("log in")
                ? "Authentication Required"
                : modalMessage.includes("balance")
                ? "Insufficient Balance"
                : modalMessage.includes("Loading")
                ? "Loading"
                : "Error"}
            </h2>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            {modalMessage.includes("log in") ? (
              <button
                className={`bg-[${backgroundColor}] hover:bg-[${backgroundColor}] text-[${mainColor}] font-semibold py-2 px-4 rounded float-right transition-colors duration-300`}
              >
                <Link
                  to={"/login"}
                  className={`text-[${mainColor}] px-2 py-1 rounded-full bg-[${backgroundColor}] mt-2 text-sm font-semibold hover:bg-[${backgroundColor}] transition-colors`}
                >
                  Login
                </Link>
              </button>
            ) : modalMessage.includes("balance") ? (
              <button
                className={`bg-[${backgroundColor}] hover:bg-[${backgroundColor}] text-[${mainColor}] font-semibold py-2 px-4 rounded float-right transition-colors duration-300`}
              >
                <Link
                  to={"/profile/deposit"}
                  className={`text-[${mainColor}] px-2 py-1 rounded-full bg-[${backgroundColor}] mt-2 text-sm font-semibold hover:bg-[${backgroundColor}] transition-colors`}
                >
                  Deposit
                </Link>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCard;
