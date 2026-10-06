import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const BettingHistory = () => {
  const { user: { _id: userId } } = useSelector((state) => state.auth);

  const [gameHistory, setGameHistory] = useState([]);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!userId) {
        setError("User ID not found");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/users/get-user-game-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();
        if (data.success) {
          setUsername(data.data.username);
          setGameHistory(data.data.gameHistory);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch game history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGameHistory();
  }, [userId]);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-100 to-gray-100" aria-live="polite">
        <div className="w-16 h-16 border-4 border-t-yellow-500 border-r-blue-500 border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-blue-700">গেম ইতিহাস লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-100 to-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-md">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-blue-800">Game History for {username}</h2>
      {gameHistory.length === 0 ? (
        <p className="text-gray-600 text-lg">No game history found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <th className="py-3 px-4 border-b border-blue-300 text-left">Game Title</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Category</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Bet Amount</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Win Amount</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Status</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Played At</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.map((entry, index) => (
                <>
                  <tr
                    key={index}
                    className="hover:bg-yellow-50 cursor-pointer transition-colors duration-200"
                    onClick={() => toggleRow(index)}
                    aria-expanded={expandedRow === index}
                  >
                    <td className="py-3 px-4 border-b border-gray-200 text-blue-700">
                      {entry.gameInfo?.title || "Unknown Game"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-blue-700">
                      {entry.gameInfo?.category || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">{entry.bet_amount} {entry.currency}</td>
                    <td className="py-3 px-4 border-b border-gray-200">{entry.win_amount} {entry.currency}</td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      <span
                        className={`px-2 py-1 rounded font-semibold ${
                          entry.status === "won" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      {new Date(entry.playedAt).toLocaleString()}
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan="6" className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-blue-300">
                        <div className="flex flex-col md:flex-row gap-4">
                          {entry.gameInfo?.image && (
                            <img
                              src={`${import.meta.env.VITE_BASE_API_URL}${entry.gameInfo.image}`}
                              alt={entry.gameInfo.title || "Game"}
                              className="w-32 h-32 object-cover rounded-lg shadow-md"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-3 text-purple-700">Game Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                              <p><strong>Username:</strong> {entry.username?.substring(0, entry.username.length - 2)}</p>
                              <p><strong>Serial Number:</strong> {entry.serial_number}</p>
                              <p><strong>Currency:</strong> {entry.currency}</p>
                              <p><strong>Played At:</strong> {new Date(entry.playedAt).toLocaleString()}</p>
                              <p><strong>Game ID:</strong> {entry.gameID}</p>
                              {entry.gameInfo ? (
                                <>
                                  <p><strong>Title:</strong> {entry.gameInfo.title}</p>
                                  <p><strong>Category:</strong> {entry.gameInfo.category}</p>
                                  <p><strong>Subcategory:</strong> {entry.gameInfo.subcategory || "N/A"}</p>
                                </>
                              ) : (
                                <p><strong>Game Info:</strong> Not available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BettingHistory;