import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function AdminProfile() {
  const { addToast } = useToasts();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const userRedux = useSelector((state) => state.auth.user);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    number: "",
    password: "",
  });
  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fetch admin profile using user ID from Redux
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!userRedux?._id) {
        addToast("ইউজার আইডি পাওয়া যায়নি", { appearance: "error", autoDismiss: true });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/users/admin/profile/${userRedux._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "প্রোফাইল তথ্য ফেচ করতে ব্যর্থ");
        }
        const data = await response.json();
        setAdmin(data);
        setFormData({
          username: data.username,
          email: data.email || "",
          number: data.number || "",
          password: "",
        });
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`ত্রুটি: ${err.message}`, { appearance: "error", autoDismiss: true });
      } finally {
        setLoading(false);
      }
    };
    fetchAdminProfile();
  }, [addToast, userRedux?._id]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!userRedux?._id) {
        addToast("ইউজার আইডি পাওয়া যায়নি", { appearance: "error", autoDismiss: true });
        return;
      }
      if (!formData.username) {
        addToast("ইউজারনেম আবশ্যক", { appearance: "error", autoDismiss: true });
        return;
      }
      if (/\s/.test(formData.username)) {
        addToast("ইউজারনেমে স্পেস থাকতে পারবে না", { appearance: "error", autoDismiss: true });
        return;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        addToast("সঠিক ইমেইল ফরম্যাট ব্যবহার করুন", { appearance: "error", autoDismiss: true });
        return;
      }
      if (formData.number && !/^\d{10,15}$/.test(formData.number)) {
        addToast("সঠিক ফোন নম্বর প্রদান করুন (১০-১৫ ডিজিট)", { appearance: "error", autoDismiss: true });
        return;
      }
      if (formData.password && (formData.password.length < 6 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password))) {
        addToast("পাসওয়ার্ডে কমপক্ষে ৬ অক্ষর, অক্ষর এবং সংখ্যা থাকতে হবে", { appearance: "error", autoDismiss: true });
        return;
      }

      const submitData = { ...formData };
      if (!submitData.password) {
        delete submitData.password; // Remove password if not provided
      }

      const response = await fetch(`${baseURL}/users/admin/update-profile/${userRedux._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "প্রোফাইল আপডেট করতে ব্যর্থ");
      }

      const data = await response.json();
      addToast(data.message, { appearance: "success", autoDismiss: true });
      setAdmin((prev) => ({ ...prev, ...submitData }));
      setEditMode(false);
    } catch (err) {
      console.error("Update error:", err);
      addToast(`ত্রুটি: ${err.message}`, { appearance: "error", autoDismiss: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-gray-200">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
          <p className="text-indigo-700 text-xl font-bold">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!admin || !userRedux?._id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-gray-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-indigo-300">
          <p className="text-indigo-700 text-xl font-bold">প্রোফাইল পাওয়া যায়নি।</p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition duration-300 shadow-lg"
          >
            ড্যাশবোর্ডে ফিরুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-extrabold text-indigo-800 drop-shadow-lg">অ্যাডমিন প্রোফাইল</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition duration-300 shadow-lg"
            >
              <FaEdit className="mr-2" /> প্রোফাইল এডিট করুন
            </button>
          )}
        </div>

        {/* Profile Details */}
        {!editMode && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-300 pb-2">ব্যক্তিগত তথ্য</h3>
                <div className="border border-indigo-200 rounded-lg overflow-hidden">
                  {[
                    { label: "ইউজারনেম", value: admin.username, bg: "bg-indigo-100" },
                    { label: "ইমেইল", value: admin.email || "N/A", bg: "bg-blue-100" },
                    { label: "ফোন নম্বর", value: admin.number || "N/A", bg: "bg-cyan-100" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between p-4 border-b border-indigo-200 last:border-b-0 ${item.bg} hover:bg-opacity-80 transition duration-300`}
                    >
                      <span className="text-gray-800 font-semibold">{item.label}</span>
                      <span className="text-gray-900 font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editMode && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-indigo-200 transform transition-all duration-500 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-extrabold text-indigo-700 drop-shadow-lg">প্রোফাইল এডিট করুন</h3>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-indigo-600 hover:text-indigo-800 transition duration-200"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-indigo-700 mb-2">ইউজারনেম *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-indigo-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-indigo-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-indigo-700 mb-2">ইমেইল</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-indigo-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-blue-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-indigo-700 mb-2">ফোন নম্বর</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-indigo-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-cyan-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-indigo-700 mb-2">পাসওয়ার্ড (OPTIONAL)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="নতুন পাসওয়ার্ড লিখুন"
                    className="w-full rounded-lg border-indigo-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-gray-50"
                  />
                  <div className="mt-3 p-4 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700 font-semibold">
                    <strong>সতর্কীকরণ:</strong> মাদার অ্যাডমিনের পাসওয়ার্ড পরিবর্তন করলে, এটি ভুলে গেলে আপনাকে অবশ্যই Data Change fee $10 দিয়ে নতুন পাসওয়ার্ড তৈরি করে নিতে হবে। পরিবর্তন করলে নিজের দায়িত্বে সংরক্ষণ করুন।
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-300 shadow-lg"
                  >
                    <FaSave className="mr-2" /> সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}