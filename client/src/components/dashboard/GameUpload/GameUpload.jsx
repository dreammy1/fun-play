import { uploadImage } from "@/hooks/files";
import { useAddGameMutation } from "@/redux/features/allApis/gameApi/gameApi";
import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";

const GameUpload = () => {
  const [addGame, { isLoading }] = useAddGameMutation();
  const [formData, setFormData] = useState({
    image: null,
    badge: "",
    isHot: false,
    isNew: false,
    gameID: "",
  });
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const { addToast } = useToasts();

  const badges = [
    { label: "None", value: "" },
    { label: "New", value: "new" },
    { label: "Hot", value: "hot" },
  ];

  // Fetch categories from premium API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          "https://apigames.oracleapi.net/api/categories",
          {
            headers: {
              "x-api-key":
                "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
            },
          }
        );
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch {}
    };
    fetchCategories();
  }, []);

  // Fetch providers when category changes
  useEffect(() => {
    if (!selectedCategory) return setProviders([]);
    const fetchProviders = async () => {
      try {
        const res = await fetch(
          "https://apigames.oracleapi.net/api/providers",
          {
            headers: {
              "x-api-key":
                "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          // Filter providers that have games in this category (optional, if API supports)
          setProviders(data.data);
        }
      } catch {}
    };
    fetchProviders();
  }, [selectedCategory]);

  // Fetch games when provider changes
  useEffect(() => {
    if (!selectedProvider) return setGames([]);
    const fetchGames = async () => {
      try {
        const res = await fetch(
          `https://apigames.oracleapi.net/api/games/pagination?page=1&limit=100&provider=${selectedProvider}`,
          {
            headers: {
              "x-api-key":
                "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
            },
          }
        );
        const data = await res.json();
        if (data.success) setGames(data.data);
      } catch {}
    };
    fetchGames();
  }, [selectedProvider]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!selectedCategory) validationErrors.category = "Category is required";
    if (!selectedProvider) validationErrors.provider = "Provider is required";
    if (!selectedGame) validationErrors.game = "Game is required";
    if (!formData.image) validationErrors.image = "Image is required";
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const { filePath } = await uploadImage(formData.image);
    const info = {
      gameID: selectedGame._id,
      image: filePath,
      badge: formData.badge,
      isHot: formData.isHot,
      isNew: formData.isNew,
    };
    const result = await addGame(info);
    if (result.error) {
      addToast(result.error.data.message, {
        appearance: "error",
        autoDismiss: true,
      });
    } else if (result.data.insertedId) {
      addToast("Game added successfully", {
        appearance: "success",
        autoDismiss: true,
      });
      setFormData({
        image: null,
        badge: "",
        isHot: false,
        isNew: false,
        gameID: "",
      });
      setPreviewImage(null);
      setSelectedCategory("");
      setSelectedProvider("");
      setSelectedGame(null);
      setErrors({});
    }
  };

  return (
    <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Game</h1>
      <form onSubmit={handleSubmit}>
        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedProvider("");
              setSelectedGame(null);
            }}
            className={`block w-full px-3 py-2 border ${
              errors.category ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Provider */}
        {selectedCategory && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedGame(null);
              }}
              className={`block w-full px-3 py-2 border ${
                errors.provider ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            >
              <option value="">Select a provider</option>
              {providers.map((prov) => (
                <option key={prov._id} value={prov._id}>
                  {prov.name}
                </option>
              ))}
            </select>
            {errors.provider && (
              <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
            )}
          </div>
        )}

        {/* Game */}
        {selectedProvider && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game
            </label>
            <select
              value={selectedGame ? selectedGame._id : ""}
              onChange={(e) => {
                const game = games.find((g) => g._id === e.target.value);
                setSelectedGame(game || null);
              }}
              className={`block w-full px-3 py-2 border ${
                errors.game ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.name}
                </option>
              ))}
            </select>
            {errors.game && (
              <p className="mt-1 text-sm text-red-600">{errors.game}</p>
            )}
          </div>
        )}

        {/* Game Image */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Game Image
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {previewImage && (
            <div className="mt-2">
              <img src={previewImage} alt="Preview" className="h-24 rounded" />
            </div>
          )}
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
          )}
        </div>

        {/* Badge */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Badge
          </label>
          <select
            name="badge"
            value={formData.badge}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {badges.map((badge) => (
              <option key={badge.value} value={badge.value}>
                {badge.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hot/New checkboxes */}
        <div className="mb-6 flex gap-6">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isHot"
              checked={formData.isHot}
              onChange={handleInputChange}
              className="mr-2"
            />
            Hot
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isNew"
              checked={formData.isNew}
              onChange={handleInputChange}
              className="mr-2"
            />
            New
          </label>
        </div>

        <div className="flex justify-end">
          <button
            disabled={isLoading}
            type="submit"
            className="px-4 py-2 bg-indigo-600 disabled:bg-slate-400 text-white rounded-md shadow-sm hover:bg-indigo-700"
          >
            Upload Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameUpload;
