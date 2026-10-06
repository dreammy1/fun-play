import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";

const Matches = () => {
  const { mainColor } = useSelector((state) => state.themeColor);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_API_URL}/games/matches`
        );
        if (response.data.success) {
          setMatches(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div
      style={{ scrollbarWidth: "thin", scrollbarColor: `${mainColor} #f3f4f6` }}
      className="flex  bg-white p-4 font-sans gap-6 overflow-x-auto "
    >
      {matches.map((match, index) => (
        <div
          key={index}
          className="min-w-[280px] rounded-lg shadow-sm shadow-gray-500 pb-3 "
        >
          <div
            style={{ backgroundColor: match.mainBackgroundColor }}
            className="flex items-center gap-2 p-2 rounded-t-lg text-sm"
          >
            <p
              className="bg-black px-1 rounded-lg"
              style={{ color: match.mainBackgroundTextColor }}
            >
              Upcoming
            </p>
            <h2
              style={{ color: match.mainBackgroundTextColor }}
              className="font-medium"
            >
              {match.league}
            </h2>
          </div>
          <div className="px-2 text-sm">
            <p
              style={{ color: match.mainBackgroundTextColor }}
              className=" text-base py-1"
            >
              {new Date(match.date).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <img
                className="size-10"
                src={`${import.meta.env.VITE_BASE_API_URL}${match?.teamImage1}`}
                alt=""
              />
              <p className="line-clamp-1">{match.team1}</p>
            </div>
            <div className="flex items-center gap-2">
              <img
                className="size-10"
                src={`${import.meta.env.VITE_BASE_API_URL}${match?.teamImage2}`}
                alt=""
              />
              <p className="line-clamp-1">{match.team2}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Matches;
