import React, { useState, useEffect } from "react";

const WelcomeBonus = () => {
  const [amount, setAmount] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState(null);

  // Fetch current welcome bonus config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/users/public/welcome-bonus`
        );
        const data = await res.json();
        if (data.success && data.bonus) {
          setCurrent(data.bonus);
          setAmount(data.bonus.amount);
          setActive(!!data.bonus.active);
        }
      } catch {
        setCurrent(null);
      }
    };
    fetchConfig();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/users/admin/set-welcome-bonus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amount), active }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage("Welcome bonus updated successfully.");
        setCurrent({ amount: Number(amount), active });
      } else {
        setMessage(data.message || "Failed to update bonus.");
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
        🎁 Welcome Bonus
      </h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Bonus Amount (BDT):
          </label>
          <input
            type="number"
            min="1"
            className="w-full border rounded px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="active" className="text-gray-700">
            Active
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Bonus"}
        </button>
        {message && (
          <div className="mt-3 text-center text-blue-600 font-semibold">
            {message}
          </div>
        )}
      </form>

      {current && (
        <div className="mb-6 text-center">
          <span className="font-semibold text-gray-700">Current Bonus:</span>{" "}
          <span className="text-blue-700">{current.amount} BDT</span>{" "}
          <span className={current.active ? "text-green-600" : "text-red-600"}>
            ({current.active ? "Active" : "Inactive"})
          </span>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <h2 className="text-xl font-semibold text-blue-600 mb-2">
          How to Claim:
        </h2>
        <ol className="list-decimal list-inside text-gray-800">
          <li>Register a new account on our platform.</li>
          <li>
            The welcome bonus will be automatically credited to your account.
          </li>
        </ol>
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">
          Bonus Details:
        </h2>
        <ul className="list-disc list-inside text-gray-800">
          <li>Bonus amount is set by admin.</li>
          <li>Wagering requirement: 10x bonus amount.</li>
          <li>Bonus valid for 7 days after activation.</li>
        </ul>
      </div>
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <h2 className="text-xl font-semibold text-green-600 mb-2">
          Terms & Conditions:
        </h2>
        <ul className="list-disc list-inside text-gray-800 text-sm">
          <li>Only one welcome bonus per user/account/device/IP.</li>
          <li>Abuse of the bonus offer may result in account suspension.</li>
          <li>General site terms and conditions apply.</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeBonus;
