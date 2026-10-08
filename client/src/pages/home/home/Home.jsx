import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import VideoSlider from "@/components/home/videoSlider/VideoSlider";
import BannerSlider from "../../../components/home/bannerSlider/BannerSlider";
import SecondaryBanner from "../../../components/home/secondaryBanner/SecondaryBanner";
import GameCard from "../../../components/shared/gameCard/GameCard";
import HomeMobileButton from "@/components/home/homeMobilButton/HomeMobileButton";
// import { useGetGamesQuery } from "@/redux/features/allApis/gameApi/gameApi";
import hotImage from "@/assets/homepageHot.svg";
import jackpotImage from "@/assets/homeJackpot.svg";
import cricketImage from "@/assets/cricket.svg";
import casinoImage from "@/assets/ld.svg";
import slotImage from "@/assets/rng.svg";
import tableImage from "@/assets/table.svg";
import sbImage from "@/assets/sb.svg";
import fishingImage from "@/assets/fishing.svg";
import crashImage from "@/assets/crash.svg";
import ImageVideoSlider from "@/components/home/ImageVideoSlider/ImageVideoSlider";
import Matches from "@/components/home/Matches/Matches";
import AnimationBanner from "../AnimationBanner/AnimationBanner";

const apiBaseUrl =
  import.meta.env.VITE_BASE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const Home = () => {
  const { addToast } = useToasts();
  // const { data: games } = useGetGamesQuery();
  const [games, setGames] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  // Fetch games from backend based on activeFilter
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        let url = "";
        if (
          activeFilter === "all" ||
          activeFilter === "jackpot" ||
          activeFilter === "hot" ||
          activeFilter === "হট গেমস"
        ) {
          url = `${import.meta.env.VITE_BASE_API_URL}/games/merged`;
        } else {
          url = `${
            import.meta.env.VITE_BASE_API_URL
          }/games/by-category/${activeFilter}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setGames(data.data);
        } else {
          setGames([]);
        }
      } catch (err) {
        setGames([]);
        console.error("Failed to fetch games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [activeFilter]);
  // (moved above)
  const [publishImage, setPublishImage] = useState("");
  const [downloadImage, setDownloadImage] = useState("");
  const [downloadApk, setDownloadApk] = useState("");
  const [secondaryBannerImage, setSecondaryBannerImage] = useState("");
  const [referImage, setReferImage] = useState({});
  const [exclusiveImage, setExclusiveImage] = useState("");
  const [downloadImageForDesktop, setDownloadImageForDesktop] = useState("");
  const [loading, setLoading] = useState(false);

  // Load More states
  const [visibleGamesCount, setVisibleGamesCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fetch publish, download images, APK URL, and downloadImageForDesktop
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/features-image`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch images");
        }
        const data = await response.json();
        setPublishImage(data.publish || "");
        setDownloadImage(data.download || "");
        setDownloadApk(data.downloadApk || "");
        setSecondaryBannerImage(data.desktop || "");
        setReferImage(data.referImage || {});
        setExclusiveImage(data.exclusiveImage || "");
        setDownloadImageForDesktop(data.downloadImageForDesktop || "");
      } catch (err) {
        console.error("Fetch error:", err);
        setPublishImage("");
        setDownloadImage("");
        setDownloadApk("");
        setSecondaryBannerImage("");
        setReferImage({});
        setExclusiveImage("");
        setDownloadImageForDesktop("");
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [baseURL]);

  // Reset visible games count when filter changes
  useEffect(() => {
    setVisibleGamesCount(20);
  }, [activeFilter]);

  // Function to handle APK download
  const handleDownload = () => {
    if (downloadApk) {
      const link = document.createElement("a");
      link.href = `${baseURL}${downloadApk}`;
      link.download = "babu88.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      addToast("No APK file available for download", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  // Load More function
  const loadMoreGames = () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setVisibleGamesCount((prevCount) => prevCount + 20);
      setIsLoadingMore(false);
    }, 500);
  };

  const buttons = [
    { image: jackpotImage, title: "Jackpot", value: "all" },
    { image: hotImage, title: "হট গেমস", value: "hot" },
    { image: cricketImage, title: "ক্রিকেট", value: "cricket" },
    { image: casinoImage, title: "ক্যাসিনো", value: "casino" },
    { image: slotImage, title: "স্লট", value: "slot" },
    { image: tableImage, title: "টেবিল খেলা", value: "table" },
    { image: sbImage, title: "এসবি", value: "sb" },
    { image: fishingImage, title: "মাছ ধরা", value: "fishing" },
    { image: crashImage, title: "ক্র্যাশ", value: "crash" },
  ];

  // Show games returned by the API; lobby is an optional admin display flag.
  let filteredGames = (games || []);
  if (activeFilter === "hot" || activeFilter === "হট গেমস") {
    filteredGames = filteredGames.filter((game) => game.hot === true);
  }

  // Check if there are more games to load
  const hasMoreGames =
    filteredGames && visibleGamesCount < filteredGames.length;

  // Get visible games (limited by visibleGamesCount)
  const visibleGames = filteredGames.slice(0, visibleGamesCount);

  useEffect(() => {
    console.log("Active filter changed:", activeFilter);
    console.log("Visible games count:", visibleGamesCount);
    console.log("Total filtered games:", filteredGames.length);
  }, [activeFilter, visibleGamesCount, filteredGames.length]); // Dependency যোগ করা

  return (
    <div>
      <BannerSlider />
      <div className="container mx-auto mt-6 md:mt-0 px-4 sm:px-10 lg:px-24">
        <SecondaryBanner
          image={secondaryBannerImage}
          baseURL={baseURL}
          imageMobil={secondaryBannerImage}
        />

        {/* Mobile Filter Buttons - Only shown on mobile */}
        {window.innerWidth < 768 && (
          <div className="py-2 flex gap-3 overflow-x-auto">
            {buttons.map((button) => (
              <HomeMobileButton
                key={button.value}
                image={button.image}
                title={button.title}
                isActive={activeFilter === button.value}
                onClick={() => setActiveFilter(button.value)}
              />
            ))}
          </div>
        )}

        {activeFilter == "all" && <AnimationBanner />}

        {/* Games Grid */}
        <div className="mt-3 md:mt-0 pb-10">
          {/* Show total games count */}
          {
            //   filteredGames.length > 0 && (
            //   <div className="mb-4 text-sm text-gray-600">
            //     মোট {filteredGames.length}টি গেমের মধ্যে {Math.min(visibleGamesCount, filteredGames.length)}টি দেখানো হচ্ছে
            //   </div>
            // )
          }

          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 lg:gap-6">
            {visibleGames.map((game) => (
              <GameCard
                key={game._id}
                gameCardImg={(function () {
                  const API_BASE = "https://apigames.oracleapi.net/api/";
                  const projectDocs = Array.isArray(game.projectImageDocs) ? game.projectImageDocs : [];
                  const preferredDoc = projectDocs.find((doc) => doc?.projectName?.title === "Babu88" && doc?.image)
                    || projectDocs.find((doc) => doc?.image);
                  const raw = preferredDoc?.image || game?.image || game?.thumbnail || game?.icon || "";
                  if (!raw) return "";
                  if (/^https?:\/\//i.test(raw)) return raw;
                  if (raw.replace(/^\/+/, "").startsWith("uploads/")) return `${apiBaseUrl}/${raw.replace(/^\/+/, "")}`;
                  return `${API_BASE}${raw.replace(/^\/+/, "")}`;
                })()}
                badge={game?.badge}
                gameHeading={game?.title || game?.name || game?.gameName || "Game"}
                gameText={typeof game?.category === "string" ? game.category : (game?.category?.name || game?.category?.title || game?.provider?.name || "Game")}
                gameLink={game?.link ? game?.link : null}
                demoId={game?._id}
                hot={game?.hot}
                isNew={game?.new}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreGames && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMoreGames}
                disabled={isLoadingMore}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  isLoadingMore
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isLoadingMore ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    লোড হচ্ছে...
                  </>
                ) : (
                  `আরও গেম লোড করুন`
                )}
              </button>
            </div>
          )}

          {/* No more games message */}
          {
            // filteredGames.length > 0 && !hasMoreGames && visibleGamesCount >= filteredGames.length && (
            //   <div className="text-center mt-6 text-gray-500">
            //     সব গেম লোড করা হয়েছে! 🎉
            //   </div>
            // )
          }

          {/* No games found message */}
          {filteredGames.length === 0 && !loading && (
            <div className="text-center mt-6 text-gray-500">
              কোনো গেম পাওয়া যায়নি 😔
            </div>
          )}
        </div>

        {/* Video Slider */}
        <div className="pb-4 md:pb-0 md:block hidden">
          <VideoSlider />
        </div>

        <div className="pb-4 md:pb-0">
          <Matches />
        </div>

        {/* Image Video Slider */}
        <div className="pb-4 md:pb-0">
          <ImageVideoSlider />
        </div>

        {/* Promotion Section */}
        {publishImage && (
          <h2 className="block md:hidden pt-4 pb-1 text-base font-semibold text-gray-800">
            প্রচার
          </h2>
        )}
        {loading ? (
          <div className="md:hidden w-full h-40 flex items-center justify-center bg-gray-200 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : publishImage ? (
          <img
            className="md:hidden rounded-2xl"
            src={`${baseURL}${publishImage}`}
            alt="Promotion"
          />
        ) : null}

        {/* Desktop Promotion Section */}
        <div className="hidden md:flex flex-col lg:flex-row gap-3 my-3">
          {referImage && (
            <div className="relative w-3/5">
              <img
                className="w-full h-52 object-fill rounded-2xl overflow-hidden"
                src={`${baseURL}${referImage.image}`}
                alt=""
              />
              <div className="text-white absolute top-0 p-4 space-y-3">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: referImage?.referTextColor }}
                >
                  {referImage?.title}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: referImage?.referTextColor }}
                >
                  {referImage?.description}
                </p>
              </div>
              <a
                href={referImage?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-6 left-10 px-4 py-1 text-lg font-bold text-black bg-yellow-400 hover:bg-yellow-600 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: referImage?.btnColor,
                  color: referImage?.btnTextColor,
                }}
              >
                {referImage?.text}
              </a>
            </div>
          )}
          {exclusiveImage && (
            <img
              className="w-2/5 object-fill rounded-2xl overflow-hidden"
              src={`${baseURL}${exclusiveImage}`}
              alt=""
            />
          )}
        </div>

        {/* Download Section */}
        {downloadImage && (
          <h2 className="block md:hidden pt-4 pb-1 text-base font-semibold text-gray-800">
            ডাউনলোড করুন
          </h2>
        )}
        {loading ? (
          <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : downloadImage || downloadImageForDesktop ? (
          <SecondaryBanner
            zipFile={downloadApk}
            image={downloadImageForDesktop}
            imageMobil={downloadImage}
            baseURL={baseURL}
            onClick={handleDownload}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Home;
