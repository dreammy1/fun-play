import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { useNavigate } from "react-router-dom";
import { FaCopy, FaEye } from "react-icons/fa";

export default function AllUser() {
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/users/admin/get-users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`Error: ${err.message}`, { appearance: "error", autoDismiss: true });
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [addToast, baseURL]);

  // Format currency
  const formatCurrency = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Copied to clipboard", { appearance: "success", autoDismiss: true });
  };

  // Navigate to user details
  const goToDetails = (id) => {
    navigate(`/dashboard/userDetails/${id}`);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">All Users</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-b-3 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-3 font-medium">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-lg font-medium">
            No users found.
          </div>
        ) : (
          <>
            {/* Desktop: Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead className="bg-indigo-700 text-white">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Username</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Phone Number</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Role</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Balance</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Total Deposit</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-200 hover:bg-indigo-50 transition duration-200"
                    >
                      <td className="py-4 px-6 text-sm text-gray-800 font-medium">{user.username}</td>
                      <td className="py-4 px-6 text-sm text-gray-800 flex items-center">
                        {user.number}
                        <button
                          className="ml-3 text-indigo-600 hover:text-indigo-800 transition"
                          onClick={() => copyToClipboard(user.number)}
                        >
                          <FaCopy className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-800 capitalize">{user.role}</td>
                      <td className="py-4 px-6 text-sm text-gray-800">{formatCurrency(user.balance)}</td>
                      <td className="py-4 px-6 text-sm text-gray-800">{formatCurrency(user.deposit)}</td>
                      <td className="py-4 px-6 text-sm">
                        <button
                          onClick={() => goToDetails(user._id)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
                        >
                          <FaEye className="mr-2 h-4 w-4" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="block lg:hidden">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-xl shadow-md p-5 mb-4 hover:shadow-lg transition duration-200 border border-gray-100"
                >
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <span className="font-semibold text-sm text-gray-900">Username:</span>
                    <span className="text-sm text-gray-700">{user.username}</span>
                    <span className="font-semibold text-sm text-gray-900">Phone:</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700">{user.number}</span>
                      <button
                        className="ml-2 text-indigo-600 hover:text-indigo-800 transition"
                        onClick={() => copyToClipboard(user.number)}
                      >
                        <FaCopy className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-sm text-gray-900">Role:</span>
                    <span className="text-sm text-gray-700 capitalize">{user.role}</span>
                    <span className="font-semibold text-sm text-gray-900">Balance:</span>
                    <span className="text-sm text-gray-700">{formatCurrency(user.balance)}</span>
                    <span className="font-semibold text-sm text-gray-900">Total Deposit:</span>
                    <span className="text-sm text-gray-700">{formatCurrency(user.deposit)}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => goToDetails(user._id)}
                      className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
                    >
                      <FaEye className="mr-2 h-4 w-4" /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}