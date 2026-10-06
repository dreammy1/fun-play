import Banner from "@/components/shared/banner/Banner";
import GameCard from "@/components/shared/gameCard/GameCard";
import RouteChange from "@/components/shared/routeChange/RouteChange";
import { useState, useEffect } from "react";
import cricketBG from "../../../assets/sports.webp"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

const Cricket = () => {
  // State for sports games, loading, error, and selected provider
  const [sportsGames, setSportsGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("সব");

  useEffect(() => {
    const fetchSportsGames = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/sports-all`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSportsGames(data.data);

          // Extract unique providers
          const uniqueProviders = [
            ...new Set(data.data.map((game) => game.provider.name)),
          ];
          setProviders(["সব", ...uniqueProviders]);
        } else {
          setSportsGames([]);
          setError("No games found");
        }
      } catch {
        setSportsGames([]);
        setError("Error loading games");
      } finally {
        setLoading(false);
      }
    };
    fetchSportsGames();
  }, []);

  // Filter games based on selected provider
  const filteredGames =
    selectedProvider === "সব"
      ? sportsGames
      : sportsGames.filter((game) => game.provider.name === selectedProvider);

  return (
    <div>
      {/* Banner img */}
      <Banner
        B_image={cricketBG}
        B_heading={"ক্রিকেট"}
        B_semiText={`${
          import.meta.env.VITE_SITE_NAME
        } হল ক্রিকেট বেটিং এর জন্য এক নম্বর চয়েস`}
        B_text={
          "সমস্ত বড় ক্রিকেট লিগের জন্য সেরা প্রতিকূলতার সাথে লাইভ বেটিং!"
        }
      />
      {/* Mobile slide menu */}
      <RouteChange text={"ক্রিকেট"} />
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

export default Cricket;
