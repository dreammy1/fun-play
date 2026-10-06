import Banner from "@/components/shared/banner/Banner";
import GameCard from "@/components/shared/gameCard/GameCard";
import RouteChange from "@/components/shared/routeChange/RouteChange";
import { useEffect, useState } from "react";
import boikhela from "../../../assets/boikhela.webp"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

const SportsBook = () => {
  // State for sports book games, loading, error, and selected provider
  const [sbGames, setSbGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("সব");

  useEffect(() => {
    const fetchSbGames = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/sb-all`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSbGames(data.data);

          // Extract unique providers
          const uniqueProviders = [
            ...new Set(data.data.map((game) => game.provider.name)),
          ];
          setProviders(["সব", ...uniqueProviders]);
        } else {
          setSbGames([]);
          setError("No games found");
        }
      } catch {
        setSbGames([]);
        setError("Error loading games");
      } finally {
        setLoading(false);
      }
    };
    fetchSbGames();
  }, []);

  // Filter games based on selected provider
  const filteredGames =
    selectedProvider === "সব"
      ? sbGames
      : sbGames.filter((game) => game.provider.name === selectedProvider);

  return (
    <div>
      {/* Banner img */}
      <Banner
        B_image={boikhela}
        B_heading={"মাছ ধরা"}
        B_semiText={`${
          import.meta.env.VITE_SITE_NAME
        } এর সাথে আপনার জয়ের জন্য রিল করুন`}
        B_text={"আপনার ভাগ্য চেষ্টা করুন এবং আজ জ্যাকপট ফিশিং গেম শুরু করুন!"}
      />
      {/* Mobile slide menu */}
      <RouteChange text={"মাছ ধরা"} />
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
                  gameHeading={game.title || game.name} // Fallback to name if title is not available
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

export default SportsBook;
