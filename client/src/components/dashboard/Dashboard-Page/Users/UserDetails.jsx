import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/users/single-user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user");
        }
        const data = await response.json();
        setUser(data);
        setFormData({
          username: data.username,
          number: data.number,
          referralCode: data.referralCode || "",
          role: data.role,
          balance: data.balance,
          fullName: data.fullName || "",
          dateOfBirth: data.dateOfBirth || "",
          email: data.email || "",
          password: "", // Initialize password field
          address: {
            house: data.address?.house || "",
            city: data.address?.city || "",
            thana: data.address?.thana || "",
            district: data.address?.district || "",
            postCode: data.address?.postCode || "",
          },
        });
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`Error: ${err.message}`, { appearance: "error", autoDismiss: true });
        navigate("/dashboard/all-user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, navigate, addToast]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.username) {
        addToast("Username is required", { appearance: "error", autoDismiss: true });
        return;
      }
      if (!formData.number) {
        addToast("Phone number is required", { appearance: "error", autoDismiss: true });
        return;
      }
      if (!formData.role) {
        addToast("Role is required", { appearance: "error", autoDismiss: true });
        return;
      }
      if (formData.balance < 0) {
        addToast("Balance cannot be negative", { appearance: "error", autoDismiss: true });
        return;
      }
      if (formData.password && formData.password.length < 6) {
        addToast("Password must be at least 6 characters long", { appearance: "error", autoDismiss: true });
        return;
      }

      const submitData = { ...formData };
      if (!submitData.password) {
        delete submitData.password; // Remove password if not provided
      }

      const response = await fetch(`${baseURL}/users/admin/update-user/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const data = await response.json();
      addToast(data.message, { appearance: "success", autoDismiss: true });
      setUser((prev) => ({ ...prev, ...formData }));
      setEditMode(false);
    } catch (err) {
      console.error("Update error:", err);
      addToast(`Error: ${err.message}`, { appearance: "error", autoDismiss: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-yellow-300"></div>
          <p className="text-white text-xl font-bold">Loading User Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-yellow-300">
          <p className="text-pink-700 text-xl font-bold">User not found.</p>
          <button
            onClick={() => navigate("/dashboard/all-user")}
            className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition duration-300 shadow-lg"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-5xl font-extrabold text-white drop-shadow-lg">User Profile</h2>
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 shadow-lg"
          >
            <FaEdit className="mr-2" /> Edit Profile
          </button>
        </div>

        {/* User Details Card */}
        <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-2xl p-8 border border-yellow-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-indigo-700 border-b-4 border-yellow-400 pb-3">Personal Information</h3>
              <div className="border border-yellow-300 rounded-lg overflow-hidden">
                {[
                  { label: "Username", value: user.username, bg: "bg-blue-200" },
                  { label: "Full Name", value: user.fullName || "N/A", bg: "bg-purple-200" },
                  { label: "Date of Birth", value: user.dateOfBirth ? formatDate(user.dateOfBirth) : "N/A", bg: "bg-pink-200" },
                  { label: "Role", value: user.role, bg: "bg-indigo-200" },
                  { label: "Referral Code", value: user.referralCode || "N/A", bg: "bg-violet-200" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between p-6 border-b border-yellow-300 last:border-b-0 ${item.bg} hover:bg-opacity-70 transition duration-300`}
                  >
                    <span className="text-gray-800 font-bold">{item.label}</span>
                    <span className="text-gray-900 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-green-700 border-b-4 border-yellow-400 pb-3">Financial Information</h3>
              <div className="border border-yellow-300 rounded-lg overflow-hidden">
                {[
                  { label: "Balance", value: formatCurrency(user.balance), bg: "bg-green-200" },
                  { label: "Total Deposit", value: formatCurrency(user.deposit), bg: "bg-teal-200" },
                  { label: "Total Withdraw", value: formatCurrency(user.withdraw), bg: "bg-emerald-200" },
                  { label: "Currency", value: user.currency, bg: "bg-lime-200" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between p-6 border-b border-yellow-300 last:border-b-0 ${item.bg} hover:bg-opacity-70 transition duration-300`}
                  >
                    <span className="text-gray-800 font-bold">{item.label}</span>
                    <span className="text-gray-900 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-orange-700 border-b-4 border-yellow-400 pb-3">Contact Information</h3>
              <div className="border border-yellow-300 rounded-lg overflow-hidden">
                {[
                  { label: "Email", value: user.email || "N/A", bg: "bg-orange-200" },
                  { label: "Primary Number", value: user.primaryNumber || user.number, bg: "bg-amber-200" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between p-6 border-b border-yellow-300 last:border-b-0 ${item.bg} hover:bg-opacity-70 transition duration-300`}
                  >
                    <span className="text-gray-800 font-bold">{item.label}</span>
                    <span className="text-gray-900 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-red-700 border-b-4 border-yellow-400 pb-3">Address</h3>
              <div className="border border-yellow-300 rounded-lg overflow-hidden">
                {[
                  { label: "House/Street", value: user.address?.house || "N/A", bg: "bg-red-200" },
                  { label: "City", value: user.address?.city || "N/A", bg: "bg-rose-200" },
                  { label: "Thana/Upazila", value: user.address?.thana || "N/A", bg: "bg-pink-200" },
                  { label: "District", value: user.address?.district || "N/A", bg: "bg-red-200" },
                  { label: "Post Code", value: user.address?.postCode || "N/A", bg: "bg-rose-200" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between p-6 border-b border-yellow-300 last:border-b-0 ${item.bg} hover:bg-opacity-70 transition duration-300`}
                  >
                    <span className="text-gray-800 font-bold">{item.label}</span>
                    <span className="text-gray-900 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-yellow-300 transform transition-all duration-500 scale-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-4xl font-extrabold text-indigo-700 drop-shadow-lg">Edit User Profile</h3>
              <button
                onClick={() => setEditMode(false)}
                className="text-yellow-500 hover:text-yellow-600 transition duration-200"
              >
                <FaTimes size={30} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Phone Number *</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-pink-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Password (Optional)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Referral Code</label>
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-violet-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-pink-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-blue-100"
                  required
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Balance *</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-green-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">House/Street</label>
                <input
                  type="text"
                  name="address.house"
                  value={formData.address.house}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-red-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-rose-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Thana/Upazila</label>
                <input
                  type="text"
                  name="address.thana"
                  value={formData.address.thana}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-pink-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">District</label>
                <input
                  type="text"
                  name="address.district"
                  value={formData.address.district}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-red-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2">Post Code</label>
                <input
                  type="text"
                  name="address.postCode"
                  value={formData.address.postCode}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-yellow-300 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 transition py-3 px-4 bg-rose-100"
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end mt-10">
                <button
                  type="submit"
                  className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-300 shadow-lg"
                >
                  <FaSave className="mr-2" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}