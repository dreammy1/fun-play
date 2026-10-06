import { useEffect, useState } from "react";
import axios from "axios";
import { useToasts } from "react-toast-notifications";
import { FaEdit, FaTrash, FaTimes, FaSave, FaPlus } from "react-icons/fa";

const GameNews = () => {
  const { addToast } = useToasts();
  const [matches, setMatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [imageFiles, setImageFiles] = useState({
    teamImage1: null,
    teamImage2: null,
  });
  const [formData, setFormData] = useState({
    league: "",
    date: "",
    team1: "",
    team2: "",
    teamImage1: "",
    teamImage2: "",
    mainBackgroundColor: "#ffffff",
    mainBackgroundTextColor: "#000000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_API_URL}/games/matches`
      );
      if (response.data.success) {
        setMatches(response.data.data);
      } else {
        addToast("Failed to fetch matches", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      addToast("Error fetching matches", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setImageFiles({ ...imageFiles, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...formData };

      if (imageFiles.teamImage1) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFiles.teamImage1);
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/upload`,
          uploadFormData
        );
        dataToSubmit.teamImage1 = response.data.filePath;
      }

      if (imageFiles.teamImage2) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFiles.teamImage2);
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/upload`,
          uploadFormData
        );
        dataToSubmit.teamImage2 = response.data.filePath;
      }

      if (currentMatch) {
        await axios.patch(
          `${import.meta.env.VITE_BASE_API_URL}/games/matches/${
            currentMatch._id
          }`,
          dataToSubmit
        );
        addToast("Match updated successfully", {
          appearance: "success",
          autoDismiss: true,
        });
      } else {
        await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/games/matches`,
          dataToSubmit
        );
        addToast("Match added successfully", {
          appearance: "success",
          autoDismiss: true,
        });
      }
      fetchMatches();
      closeModal();
    } catch (error) {
      console.error("Error saving match:", error);
      addToast("Error saving match", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (match = null) => {
    setCurrentMatch(match);
    setImageFiles({ teamImage1: null, teamImage2: null });
    if (match) {
      setFormData({
        league: match.league,
        date: match.date,
        team1: match.team1,
        team2: match.team2,
        teamImage1: match.teamImage1,
        teamImage2: match.teamImage2,
        mainBackgroundColor: match.mainBackgroundColor || "#ffffff",
        mainBackgroundTextColor: match.mainBackgroundTextColor || "#000000",
      });
    } else {
      setFormData({
        league: "",
        date: "",
        team1: "",
        team2: "",
        teamImage1: "",
        teamImage2: "",
        mainBackgroundColor: "#ffffff",
        mainBackgroundTextColor: "#000000",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMatch(null);
    setImageFiles({ teamImage1: null, teamImage2: null });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_BASE_API_URL}/games/matches/${id}`
        );
        addToast("Match deleted successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        fetchMatches();
      } catch (error) {
        console.error("Error deleting match:", error);
        addToast("Error deleting match", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Matches Control
        </h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <FaPlus /> Add Match
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
          Manage Matches
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  League
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Team 1
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Team 2
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => (
                <tr
                  key={match._id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition duration-150`}
                >
                  <td className="py-3 px-4 text-gray-700">{match.league}</td>
                  <td className="py-3 px-4 text-gray-700">{match.date}</td>
                  <td className="py-3 px-4 text-gray-700">{match.team1}</td>
                  <td className="py-3 px-4 text-gray-700">{match.team2}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(match)}
                        className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition duration-200"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(match._id)}
                        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-200"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {currentMatch ? "Edit Match" : "Add Match"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800 transition duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    League
                  </label>
                  <input
                    type="text"
                    name="league"
                    value={formData.league}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 1
                  </label>
                  <input
                    type="text"
                    name="team1"
                    value={formData.team1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 2
                  </label>
                  <input
                    type="text"
                    name="team2"
                    value={formData.team2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 1 Image
                  </label>
                  <input
                    type="file"
                    name="teamImage1"
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="image/*"
                    required={!currentMatch}
                  />
                  {(formData.teamImage1 || imageFiles.teamImage1) && (
                    <div className="mt-2">
                      <img
                        src={
                          imageFiles.teamImage1
                            ? URL.createObjectURL(imageFiles.teamImage1)
                            : `${import.meta.env.VITE_BASE_API_URL}${
                                formData.teamImage1
                              }`
                        }
                        alt="Team 1"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 2 Image
                  </label>
                  <input
                    type="file"
                    name="teamImage2"
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="image/*"
                    required={!currentMatch}
                  />
                  {(formData.teamImage2 || imageFiles.teamImage2) && (
                    <div className="mt-2">
                      <img
                        src={
                          imageFiles.teamImage2
                            ? URL.createObjectURL(imageFiles.teamImage2)
                            : `${import.meta.env.VITE_BASE_API_URL}${
                                formData.teamImage2
                              }`
                        }
                        alt="Team 2"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    name="mainBackgroundColor"
                    value={formData.mainBackgroundColor}
                    onChange={handleInputChange}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    name="mainBackgroundTextColor"
                    value={formData.mainBackgroundTextColor}
                    onChange={handleInputChange}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition duration-200 ${
                    isSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <FaSave />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameNews;
