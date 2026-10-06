import { useState, useEffect } from "react";

const GameHistory = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedUserRow, setExpandedUserRow] = useState(null);
  const [expandedGameRow, setExpandedGameRow] = useState({});

  useEffect(() => {
    const fetchAllUsersGameHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/users/get-all-users-game-history`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch users' game history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllUsersGameHistory();
  }, []);

  const toggleUserRow = (index) => {
    setExpandedUserRow(expandedUserRow === index ? null : index);
    setExpandedGameRow({}); // Reset game row expansions when user row changes
  };

  const toggleGameRow = (userIndex, gameIndex) => {
    setExpandedGameRow((prev) => ({
      ...prev,
      [`${userIndex}-${gameIndex}`]: prev[`${userIndex}-${gameIndex}`] ? false : true,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-100 to-gray-100" aria-live="polite">
        <div className="w-16 h-16 border-4 border-t-yellow-500 border-r-blue-500 border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-blue-700">সকল ব্যবহারকারীর গেম ইতিহাস লোড হচ্ছে...</p>
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
      <h2 className="text-3xl font-bold mb-6 text-blue-800">All Users Game History</h2>
      {users.length === 0 ? (
        <p className="text-gray-600 text-lg">No users with game history found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <th className="py-3 px-4 border-b border-blue-300 text-left">Username</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Phone Number</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left">Game History Count</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, userIndex) => (
                <>
                  <tr
                    key={user._id}
                    className="hover:bg-yellow-50 cursor-pointer transition-colors duration-200"
                    onClick={() => toggleUserRow(userIndex)}
                    aria-expanded={expandedUserRow === userIndex}
                    role="button"
                  >
                    <td className="py-3 px-4 border-b border-gray-200 text-blue-700">
                      {user.username}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">{user.number}</td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      {user.gameHistory.length}
                    </td>
                  </tr>
                  {expandedUserRow === userIndex && (
                    <tr>
                      <td colSpan="3" className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-blue-300">
                        <div className="overflow-x-auto">
                          <h3 className="text-xl font-semibold mb-3 text-purple-700">
                            Game History for {user.username}
                          </h3>
                          {user.gameHistory.length === 0 ? (
                            <p className="text-gray-600">No game history available.</p>
                          ) : (
                            <table className="min-w-full bg-white border border-blue-200 rounded-md shadow-sm">
                              <thead>
                                <tr className="bg-gradient-to-r from-blue-400 to-purple-400 text-white">
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Game Title</th>
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Category</th>
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Bet Amount</th>
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Win Amount</th>
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Status</th>
                                  <th className="py-2 px-4 border-b border-blue-200 text-left">Played At (Latest)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {user.gameHistory.map((entry, gameIndex) => (
                                  <>
                                    <tr
                                      key={gameIndex}
                                      className="hover:bg-yellow-100 cursor-pointer transition-colors duration-200"
                                      onClick={() => toggleGameRow(userIndex, gameIndex)}
                                      aria-expanded={expandedGameRow[`${userIndex}-${gameIndex}`]}
                                      role="button"
                                    >
                                      <td className="py-2 px-4 border-b border-gray-100 text-blue-600">
                                        {entry.gameInfo?.title || "Unknown Game"}
                                      </td>
                                      <td className="py-2 px-4 border-b border-gray-100 text-blue-600">
                                        {entry.gameInfo?.category || "N/A"}
                                      </td>
                                      <td className="py-2 px-4 border-b border-gray-100">{entry.bet_amount} {entry.currency}</td>
                                      <td className="py-2 px-4 border-b border-gray-100">{entry.win_amount} {entry.currency}</td>
                                      <td className="py-2 px-4 border-b border-gray-100">
                                        <span
                                          className={`px-2 py-1 rounded font-semibold ${
                                            entry.status === "won" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                          }`}
                                        >
                                          {entry.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-4 border-b border-gray-100">
                                        {new Date(entry.playedAt).toLocaleString()}
                                      </td>
                                    </tr>
                                    {expandedGameRow[`${userIndex}-${gameIndex}`] && (
                                      <tr>
                                        <td colSpan="6" className="bg-gradient-to-r from-gray-100 to-blue-100 p-4 border-b border-blue-200">
                                          <div className="flex flex-col md:flex-row gap-4">
                                            {entry.gameInfo?.image && (
                                              <img
                                                src={`${import.meta.env.VITE_BASE_API_URL}${entry.gameInfo.image}`}
                                                alt={entry.gameInfo.title || "Game"}
                                                className="w-32 h-32 object-cover rounded-lg shadow-md"
                                              />
                                            )}
                                            <div className="flex-1">
                                              <h4 className="text-lg font-semibold mb-2 text-purple-700">Game Details</h4>
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
                          )}
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

export default GameHistory;