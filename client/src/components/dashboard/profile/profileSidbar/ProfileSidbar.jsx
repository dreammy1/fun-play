import { CiShare2, CiUser } from "react-icons/ci";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";
import { useToasts } from "react-toast-notifications"; // Replaced react-toastify

const generateReferId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "GMJ";
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const ProfileSidbar = () => {
  const { user } = useSelector((state) => state.auth);
  const [referId, setReferId] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const { addToast } = useToasts(); // Initialize useToasts hook

  useEffect(() => {
    if (user?.referId) {
      setReferId(user.referId);
    } else {
      // Generate a referId for display only (not saved to backend)
      setReferId(generateReferId());
    }
  }, [user]);

  const handleCopy = () => {
    const url = `${window.location.origin}/register?refer=${referId}`;
    navigator.clipboard.writeText(url);
    setCopyMsg("Referral link copied!");
    setTimeout(() => setCopyMsg(""), 1500);
  };

  // Redeem refer wallet logic
  const handleRedeem = async () => {
    try {
      // Get token from localStorage (or redux if you store it there)
      const token = localStorage.getItem("token");
      if (!token) {
        addToast("You must be logged in to redeem.", { appearance: "error" }); // Updated to use addToast
        return;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_BASE_API_URL}/users/redeem-refer-wallet`,
        { userId: user?._id },
        {
          headers: { Authorization: `bearer ${token}` },
        }
      );

      if (res.data.success) {
        addToast(res.data.message || "Redeemed successfully!", {
          appearance: "success",
        }); // Updated to use addToast
        // Optionally update UI: reload or update user state
        window.location.reload();
      } else {
        addToast(res.data.message || "Redeem failed.", { appearance: "error" }); // Updated to use addToast
      }
    } catch (err) {
      const msg = err?.response.data.message || "Redeem failed.";
      addToast(msg, { appearance: "error" }); // Updated to use addToast
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg space-y-2">
      <p className="text-lg font-semibold">স্বাগতম!</p>
      <div className="flex gap-2 items-center p-3 bg-slate-100 rounded-lg">
        <div className="p-2 bg-white rounded-full">
          <CiUser />
        </div>
        <p className="text-base font-semibold text-blue-600">
          {user?.username}
        </p>
      </div>

      <div className="p-3 bg-slate-100 space-y-2 rounded-lg">
        <div className="flex justify-between gap-2 items-center">
          <div className="p-2 bg-white rounded-full">
            <CiUser />
          </div>
          <div className="flex gap-1">
            <p className="text-base text-black">বেটিং পাস</p>
            <span className="text-base text-blue-600">স্তর</span>
          </div>
        </div>
        <div className="bg-slate-300 border border-slate-300 w-full h-1"></div>
        <p className="text-base font-semibold text-blue-600">0/800.00</p>
      </div>

      <div className="p-3 bg-slate-100 space-y-2 rounded-lg">
        <div className="flex justify-between gap-2 items-center">
          <div className="">
            <img
              className="w-8"
              src="https://www.babu88h.com/static/image/viptier/bronze.png"
              alt=""
            />
          </div>
          <div className="flex gap-1">
            <p className="text-base text-black">VIP</p>
            <span className="text-base text-blue-600">MEMBER</span>
          </div>
        </div>
        <div className="bg-slate-300 border border-slate-300 w-full h-1"></div>
        <p className="text-base font-semibold text-blue-600">0/60000</p>
      </div>

      <div className="p-3 bg-slate-100 rounded-lg">
        <p className="text-base font-semibold text-gray-500">
          পুরস্কারের কয়েন
        </p>
        <p className="text-base font-semibold text-blue-600">0</p>
        <button className="mt-3 py-3 px-4 w-full text-xs font-bold bg-yellow-500 hover:bg-yellow-400 duration-300 rounded-full">
          পুরস্কার-এ যান
        </button>
      </div>

      <div className="p-3 bg-slate-100 rounded-lg">
        <p className="text-base font-semibold text-gray-500">রেফারেল ওয়ালেট</p>
        <p className="text-base font-semibold text-blue-600">
          ৳ {user?.referWallet !== undefined ? user.referWallet : "0.00"}
        </p>
        <button
          className="mt-3 py-3 px-4 w-full text-xs font-bold bg-yellow-500 hover:bg-yellow-400 duration-300 rounded-full"
          onClick={handleRedeem}
        >
          রিডিম
        </button>
        <p className="mt-2 text-sm text-gray-600">
          আপনার রেফারেল কোড ব্যবহার করে সাইন আপ করার জন্য আপনার বন্ধুদের
          আমন্ত্রণ জানিয়ে আমাদের একচেটিয়া রেফারেল প্রোগ্রামের সাথে অতিরিক্ত
          নগদ উপার্জন করুন
        </p>

        <p className="mt-6 py-2 px-3 w-full text-base font-bold text-gray-500 bg-slate-300 duration-300 rounded-lg">
          {referId}
        </p>
        <button
          className="flex items-center justify-center mt-3 py-2 px-4 w-full text-white bg-blue-500 hover:bg-blue-600 duration-300 rounded-full"
          onClick={handleCopy}
        >
          <CiShare2 size={25} />
        </button>
        {copyMsg && (
          <div className="text-green-600 text-center mt-2 text-xs">
            {copyMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSidbar;
