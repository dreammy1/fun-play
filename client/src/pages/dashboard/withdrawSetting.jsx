import React, { useState, useEffect } from "react";

const WithdrawSetting = () => {
  const [minWithdraw, setMinWithdraw] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentSettings, setCurrentSettings] = useState(null);

  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fetch current withdraw settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${baseURL}/withdraws/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setCurrentSettings(data.settings);
          setMinWithdraw(data.settings.minWithdraw);
        }
      } catch {
        setCurrentSettings(null);
      }
    };
    fetchSettings();
  }, [baseURL]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${baseURL}/withdraws/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          minWithdraw: Number(minWithdraw),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Withdraw settings updated successfully.");
        setCurrentSettings({
          minWithdraw: Number(minWithdraw),
        });
      } else {
        setMessage(data.message || "Failed to update settings.");
      }
    } catch (err) {
      setMessage("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">
        Withdraw Settings
      </h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Minimum Withdraw (BDT):
          </label>
          <input
            type="number"
            min="0"
            className="w-full border rounded px-3 py-2"
            value={minWithdraw}
            onChange={(e) => setMinWithdraw(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <div className="mt-3 text-center text-blue-600 font-semibold">
            {message}
          </div>
        )}
      </form>

      {currentSettings && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Current Settings
          </h2>
          <p>
            <span className="font-semibold text-gray-700">
              Min Withdraw:
            </span>{" "}
            <span className="text-blue-700">
              {currentSettings.minWithdraw} BDT
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default WithdrawSetting;