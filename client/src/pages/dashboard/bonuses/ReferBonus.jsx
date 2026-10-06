import React, { useState, useEffect } from "react";

const ReferBonus = () => {
  const [amount, setAmount] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState(null);
  const [minWithdraw, setMinWithdraw] = useState(0);

  // Fetch current refer bonus config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/users/public/refer-bonus`
        );
        const data = await res.json();
        if (data.success && data.bonus) {
          setCurrent(data.bonus);
          setAmount(data.bonus.amount);
          setActive(!!data.bonus.active);
          setMinWithdraw(data.bonus.minWithdraw || 0);
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
        `${import.meta.env.VITE_BASE_API_URL}/users/admin/set-refer-bonus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            active,
            minWithdraw: Number(minWithdraw),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage("Refer bonus updated successfully.");
        setCurrent({
          amount: Number(amount),
          active,
          minWithdraw: Number(minWithdraw),
        });
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
      <h1 className="text-3xl font-bold text-center text-green-700 mb-4">
        🤝 Refer Bonus
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
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Withdrawal Minimum Limit (BDT):
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
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Bonus"}
        </button>
        {message && (
          <div className="mt-3 text-center text-green-600 font-semibold">
            {message}
          </div>
        )}
      </form>

      {current && (
        <div className="mb-6 text-center">
          <span className="font-semibold text-gray-700">Current Bonus:</span>{" "}
          <span className="text-green-700">{current.amount} BDT</span>{" "}
          <span className={current.active ? "text-green-600" : "text-red-600"}>
            ({current.active ? "Active" : "Inactive"})
          </span>
          <br />
          <span className="font-semibold text-gray-700">
            Min Withdraw Limit:
          </span>{" "}
          <span className="text-green-700">{current.minWithdraw || 0} BDT</span>
        </div>
      )}

      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <h2 className="text-xl font-semibold text-green-600 mb-2">
          How to Claim:
        </h2>
        <ol className="list-decimal list-inside text-gray-800">
          <li>Invite a friend to register using your referral link.</li>
          <li>
            When your friend registers and meets the requirements, you will
            receive the refer bonus automatically.
          </li>
        </ol>
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">
          Bonus Details:
        </h2>
        <ul className="list-disc list-inside text-gray-800">
          <li>Bonus amount is set by admin.</li>
          <li>Bonus is credited after successful referral registration.</li>
          <li>Bonus valid for 7 days after activation.</li>
        </ul>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <h2 className="text-xl font-semibold text-blue-600 mb-2">
          Terms & Conditions:
        </h2>
        <ul className="list-disc list-inside text-gray-800 text-sm">
          <li>Only one refer bonus per successful referral.</li>
          <li>Abuse of the bonus offer may result in account suspension.</li>
          <li>General site terms and conditions apply.</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferBonus;
