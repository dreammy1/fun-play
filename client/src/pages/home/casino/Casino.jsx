import Banner from "@/components/shared/banner/Banner";
import GameCard from "@/components/shared/gameCard/GameCard";
import RouteChange from "@/components/shared/routeChange/RouteChange";
import { useState, useEffect } from "react";
import casino_bg from "../../../assets/casino.webp";

const Casino = () => {
  // State for casino games, loading, error, and selected provider
  const [casinoGames, setCasinoGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("সব");

  useEffect(() => {
    const fetchCasinoGames = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/casino-all`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCasinoGames(data.data);

          // Extract unique providers
          const uniqueProviders = [
            ...new Set(data.data.map((game) => game.provider.name)),
          ];
          setProviders(["সব", ...uniqueProviders]);
        } else {
          setCasinoGames([]);
          setError("No games found");
        }
      } catch {
        setCasinoGames([]);
        setError("Error loading games");
      } finally {
        setLoading(false);
      }
    };
    fetchCasinoGames();
  }, []);

  // Filter games based on selected provider
  const filteredGames =
    selectedProvider === "সব"
      ? casinoGames
      : casinoGames.filter((game) => game.provider.name === selectedProvider);

  return (
    <div>
      {/* Banner img */}
      <Banner
        B_image={casino_bg}
        B_heading={"ক্যাসিনো"}
        B_semiText={`${
          import.meta.env.VITE_SITE_NAME
        } এর সাথে লাইভ ডিলার এবং অন্যান্য আসল খেলোয়াড়দের সাথে খেলুন`}
        B_text={
          "ক্রেজি টাইম, অন্দর বাহার এবং লাইটনিং রুলেটের মতো সব বড় হিটগুলি উপভোগ করুন!"
        }
      />
      {/* Mobile slide menu */}
      <RouteChange text={"ক্যাসিনো"} />
      {/* Provider Filter */}
      <div className="container mx-auto px-4 sm:px-10 lg:px-24 mt-6">
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {providers.map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-4 py-2 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                selectedProvider === provider
                  ? "bg-yellow-500 text-white border border-yellow-600"
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              }`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>
      {/* Games */}
      <div className="container mx-auto px-4 sm:px-10 lg:px-24">
        <div className="mt-10 pb-10">
          {loading ? (
            <div className="text-center text-gray-500">Loading games...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center text-gray-500">No games available</div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 lg:gap-6">
              {filteredGames.map((game) => (
                <GameCard
                  demoId={game._id}
                  key={game._id}
                  gameCardImg={(function() {
                    const BASE = "https://apigames.oracleapi.net/api/";
                    const projectDocs = game.projectImageDocs || [];
                    const babuDoc = Array.isArray(projectDocs)
                      ? projectDocs.find((d) => d?.projectName?.title === "Babu88")
                      : null;
                    const raw = babuDoc?.image  || "";
                    if (!raw) return "";
                    const isAbs = /^https?:\/\//i.test(raw);
                    return isAbs ? raw : `${BASE}${raw}`;
                  })()}
                  gameLink={game?.link ? game?.link : null}
                  hot={game.hot}
                  isNew={game.new}
                  gameHeading={game.title || game.name}
                  headingCenter={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Casino;
