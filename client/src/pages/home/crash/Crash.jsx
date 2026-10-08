import Banner from "@/components/shared/banner/Banner";
import GameCard from "@/components/shared/gameCard/GameCard";
import RouteChange from "@/components/shared/routeChange/RouteChange";
import { useState, useEffect } from "react";
import crashBG from "../../../assets/crash.jpg"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

const Crash = () => {
  // State for crash games, loading, error, and selected provider
  const [crashGames, setCrashGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("সব");

  useEffect(() => {
    const fetchCrashGames = async () => {
      setLoading(true);
        setError("");
        try {
          const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/games/by-category/crash`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCrashGames(data.data);

          // Extract unique providers
          const uniqueProviders = [
            ...new Set(data.data.map((game) => game.provider.name)),
          ];
          setProviders(["সব", ...uniqueProviders]);
        } else {
          setCrashGames([]);
          setError("No games found");
        }
      } catch {
        setCrashGames([]);
        setError("Error loading games");
      } finally {
        setLoading(false);
      }
    };
    fetchCrashGames();
  }, []);

  // Filter games based on selected provider
  const filteredGames =
    selectedProvider === "সব"
      ? crashGames
      : crashGames.filter((game) => game.provider.name === selectedProvider);

  return (
    <div>
      {/* Banner img */}
      <Banner
        B_image={crashBG}
        B_heading={"ক্র্যাশ গেম"}
        B_semiText={`${
          import.meta.env.VITE_SITE_NAME
        }-এ দ্রুতগতির ক্র্যাশ গেম খেলুন`}
        B_text="ক্র্যাশ হওয়ার আগে ক্যাশ আউট করুন এবং প্রতিটি রাউন্ড উপভোগ করুন।"
      />
      {/* Mobile slide menu */}
      <RouteChange text={"ক্র্যাশ গেম"} />
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
                  gameCardImg={game}
                  gameLink={game?.link ? game?.link : null}
                  hot={game.hot}
                  isNew={game.new}
                  gameHeading={game.title || game.name} // Fallback to name if title is not available
                  gameText={game.category?.name || game.category || game.provider?.name}
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

export default Crash;
