import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const Referral = () => {
  const { user } = useSelector((state) => state.auth);
  const [referId, setReferId] = useState("");
  const [referWallet, setReferWallet] = useState(0);
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    if (user?._id) {
      // Fetch user info from backend to get latest referId and referWallet
      fetch(
        `${import.meta.env.VITE_BASE_API_URL}/users/single-user/${user._id}`
      )
        .then((res) => res.json())
        .then((data) => {
          setReferId(data?.referId || user?.referId || "");
          setReferWallet(
            data?.referWallet !== undefined
              ? data.referWallet
              : user?.referWallet || 0
          );
        });
    }
  }, [user]);

  const handleCopy = () => {
    const url = `${window.location.origin}/register?refer=${referId}`;
    navigator.clipboard.writeText(url);
    setCopyMsg("Referral link copied!");
    setTimeout(() => setCopyMsg(""), 1500);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
        🎁 রেফারেল তথ্য
      </h1>
      <div className="mb-4 text-center">
        <span className="font-semibold text-gray-700">রেফারেল ওয়ালেট:</span>{" "}
        <span className="text-blue-700">
          ৳ {referWallet !== undefined ? referWallet : "0.00"}
        </span>
      </div>
      <div className="mb-4 text-center">
        <span className="font-semibold text-gray-700">রেফারেল কোড:</span>{" "}
        <span className="text-blue-700">{referId}</span>
      </div>
      <div className="mb-4 text-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          onClick={handleCopy}
        >
          রেফারেল লিংক কপি করুন
        </button>
        {copyMsg && (
          <div className="text-green-600 text-center mt-2 text-xs">
            {copyMsg}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-600">
          {window.location.origin}/register?refer={referId}
        </div>
      </div>
    </div>
  );
};

export default Referral;
