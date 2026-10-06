import { deleteImage, uploadImage } from "@/hooks/files";
import { useUpdateGameMutation } from "@/redux/features/allApis/gameApi/gameApi";
import { useGetCategoriesQuery } from "@/redux/features/allApis/categoriesApi/categoriesApi";
import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { FiUpload, FiChevronDown, FiX } from "react-icons/fi";

// Form component for updating image/hot/new for a game
// Selection toggle component (saves only gameID)
function SelectionToggle({ selected, onChange, saving }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={!!selected}
        onChange={(e) => onChange(e.target.checked)}
        disabled={saving}
      />
      <span>{selected ? "Selected" : "Select"}</span>
    </label>
  );
}

// Flag toggles (enabled when selected)
function FlagToggles({ game, disabled, onSave, saving }) {
  const [hot, setHot] = useState(!!game.hot);
  const [isNew, setIsNew] = useState(!!game.new);
  const [lobby, setLobby] = useState(!!game.lobby);

  useEffect(() => {
    setHot(!!game.hot);
    setIsNew(!!game.new);
    setLobby(!!game.lobby);
  }, [game.hot, game.new, game.lobby]);

  const save = async (patch) => {
    await onSave({ hot, new: isNew, lobby, ...patch });
  };

  return (
    <div className={`flex items-center gap-4 ${disabled ? "opacity-50" : ""}`}>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={hot}
          disabled={disabled || saving}
          onChange={async (e) => {
            const next = e.target.checked;
            setHot(next);
            await save({ hot: next });
          }}
        />
        Hot
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={isNew}
          disabled={disabled || saving}
          onChange={async (e) => {
            const next = e.target.checked;
            setIsNew(next);
            await save({ new: next });
          }}
        />
        New
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={lobby}
          disabled={disabled || saving}
          onChange={async (e) => {
            const next = e.target.checked;
            setLobby(next);
            await save({ lobby: next });
          }}
        />
        Lobby
      </label>
    </div>
  );
}

const GamesList = () => {
  const { data: categoriesData = [], isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();
  const [updateGame] = useUpdateGameMutation();
  // Upsert no longer used for images; selection saved via dedicated endpoint
  const { addToast } = useToasts();
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [savingFlagsId, setSavingFlagsId] = useState("");

  // Fetch only user-created providers from backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/categories/providers`
        );
        const data = await res.json();
        if (data.success) setProviders(data.data);
      } catch (err) {
        console.error("Failed to fetch user providers:", err);
      }
    };
    fetchProviders();
  }, []);

  // Fetch paginated games via backend
  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }
    const fetchAndEnrichGames = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_BASE_API_URL
          }/games/by-provider/${selectedProvider}?page=${page}&limit=50`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Backend error: ${res.status} ${text}`);
        }
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) {
          setGames([]);
          setTotalPages(1);
          setIsLoading(false);
          return;
        }
        setGames(data.data);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setIsError(true);
        setGames([]);
        setTotalPages(1);
        console.error("GameList fetch error:", err);
      }
      setIsLoading(false);
    };
    fetchAndEnrichGames();
  }, [selectedProvider, page]);

  // Fetch selected game IDs once
  useEffect(() => {
    const loadSelected = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/games/selected`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setSelectedIds(data.data);
        }
      } catch {
        // ignore
      }
    };
    loadSelected();
  }, []);

  const toggleSelect = async (gid, next) => {
    try {
      setSavingId(gid);
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/games/selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameID: gid, selected: next }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "Failed");
      setSelectedIds((prev) => {
        const set = new Set(prev);
        if (next) set.add(gid);
        else set.delete(gid);
        return Array.from(set);
      });
    } catch (err) {
      console.error("Selection save failed", err);
      addToast("Failed to save selection", { appearance: "error", autoDismiss: true });
    } finally {
      setSavingId("");
    }
  };

  const saveFlags = async (gameId, patch) => {
    try {
      setSavingFlagsId(gameId);
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/games/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameID: gameId, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to save flags");
      // update local games state
      setGames((prev) =>
        prev.map((g) =>
          g._id === gameId ? { ...g, ...patch } : g
        )
      );
    } catch (err) {
      console.error("Flag save failed", err);
      addToast("Failed to save flags", { appearance: "error", autoDismiss: true });
    } finally {
      setSavingFlagsId("");
    }
  };

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    title: "",
    category: "",
    subcategory: "",
    badge: "",
    link: "",
    image: null,
    imagePreview: null,
    oldImage: null,
  });

  const categories = [
    { label: "ক্রিকেট", value: "cricket" },
    { label: "ক্যাসিনো", value: "casino" },
    { label: "স্লট", value: "slot" },
    { label: "টেবিল খেলা", value: "table" },
    { label: "এসবি", value: "sb" },
    { label: "মাছ ধরা", value: "fishing" },
    { label: "ক্র্যাশ", value: "crash" },
  ];

  const badges = [
    { label: "None", value: "" },
    { label: "New", value: "new" },
    { label: "Hot", value: "hot" },
  ];

  // Get unique subcategories based on selected category
  const getFilteredSubcategories = (selectedCategory) => {
    if (!selectedCategory || isCategoriesLoading) return [];
    return categoriesData
      .filter((cat) => cat.category === selectedCategory)
      .map((cat) => ({
        label: cat.title,
        value: cat.value,
      }));
  };

  // Edit flow currently not exposed in UI

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      if (file) {
        setEditFormData({
          ...editFormData,
          image: file,
          imagePreview: URL.createObjectURL(file),
        });
      }
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
        ...(name === "category" ? { subcategory: "" } : {}),
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.id) {
      addToast("Invalid game ID", { appearance: "error", autoDismiss: true });
      return;
    }

    const updateData = {
      title: editFormData.title,
      category: editFormData.category,
      subcategory: editFormData.subcategory,
      badge: editFormData.badge,
      link: editFormData.link,
    };

    try {
      if (editFormData.image && editFormData.oldImage) {
        try {
          await deleteImage(editFormData.oldImage);
        } catch (err) {
          console.error("Failed to delete old image:", err);
          addToast(`Failed to delete old image: ${err.message}`, {
            appearance: "warning",
            autoDismiss: true,
          });
        }
        const { filePath } = await uploadImage(editFormData.image);
        updateData.image = filePath;
      }

      const result = await updateGame({
        id: editFormData.id,
        data: updateData,
      }).unwrap();

      if (result.modifiedCount > 0) {
        addToast("Game updated successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        setIsEditModalOpen(false);
        setEditFormData({
          id: "",
          title: "",
          category: "",
          subcategory: "",
          badge: "",
          link: "",
          image: null,
          imagePreview: null,
          oldImage: null,
        });
      } else {
        addToast("No changes made to the game", {
          appearance: "warning",
          autoDismiss: true,
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      addToast(
        error.data?.message || `Failed to update game: ${error.message}`,
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  // Delete flow currently not exposed in UI

  // Delete flow removed from UI

  if (isLoading || isCategoriesLoading)
    return <div className="text-center py-8">Loading games...</div>;
  if (isError)
    return (
      <div className="text-center py-8 text-red-500">
        Error loading games. Check the browser console for details.
      </div>
    );

  return (
    <div className="container mx-auto w-full md:w-3/4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">All Games</h1>

      {/* Provider Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Provider</h2>
        <select
          value={selectedProvider}
          onChange={(e) => {
            // console.log(e.target.value, selectedProvider);

            setSelectedProvider(e.target.value);
            setPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a provider</option>
          {providers.map((prov) => (
            <option
              key={prov._id.provider || prov._id._id || prov._id._id}
              value={prov.provider || prov._id.provider || prov._id.provider}
            >
              {console.log(prov)}
              {prov.name || prov._id.providerName || prov.providerName}
            </option>
          ))}
        </select>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No games found for this provider</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div
              key={game._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Game Image with Badge */}
              <div className="relative">
             
                {(() => {
                  const projectDocs = game.projectImageDocs || [];
                  const babuDoc = Array.isArray(projectDocs)
                    ? projectDocs.find((d) => d?.projectName?.title === "Babu88")
                    : null;
                  const rawPath = babuDoc?.image  || "";

                  if (!rawPath) {
                    return <div className="w-full h-48 bg-gray-100" />;
                  }

                  const isAbsolute = /^https?:\/\//i.test(rawPath);
                  const src = isAbsolute
                    ? rawPath
                    : `https://apigames.oracleapi.net/api/${rawPath}`;

                  return (
                    <img
                      src={src}
                      alt={game.name}
                      className="w-full h-48 object-cover"
                    />
                  );
                })()}
                {game.hot && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Hot
                  </span>
                )}
                {game.new && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    New
                  </span>
                )}
              </div>

              {/* Game Info and Update Form */}
              <div className="p-4">
                <h3 className="font-bold text-lg truncate">{game.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <SelectionToggle
                    selected={selectedIds.includes(game._id) || game.selected}
                    onChange={(next) => toggleSelect(game._id, next)}
                    saving={savingId === game._id}
                  />
                </div>
                <div className="mt-3">
                  <FlagToggles
                    game={game}
                    disabled={!(selectedIds.includes(game._id) || game.selected)}
                    onSave={(patch) => saveFlags(game._id, patch)}
                    saving={savingFlagsId === game._id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-4 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Modal removed */}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Edit Game
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Image Upload with Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Game Image
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition">
                    <FiUpload className="text-lg" />
                    Upload Image
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleEditChange}
                      className="hidden"
                    />
                  </label>
                  {editFormData.imagePreview && (
                    <img
                      src={editFormData.imagePreview}
                      alt="Preview"
                      className="h-16 w-16 rounded object-cover border border-gray-200"
                    />
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Game Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Cricket Mania"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditChange}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subcategory
                </label>
                <div className="relative">
                  <select
                    name="subcategory"
                    value={editFormData.subcategory}
                    onChange={handleEditChange}
                    disabled={!editFormData.category}
                    className={`w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      !editFormData.category ? "bg-gray-100" : ""
                    }`}
                  >
                    <option value="">Select a subcategory</option>
                    {getFilteredSubcategories(editFormData.category).map(
                      (sub) => (
                        <option key={sub.value} value={sub.value}>
                          {sub.label}
                        </option>
                      )
                    )}
                  </select>
                  <FiChevronDown className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Badge
                </label>
                <div className="relative">
                  <select
                    name="badge"
                    value={editFormData.badge}
                    onChange={handleEditChange}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {badges.map((badge) => (
                      <option key={badge.value} value={badge.value}>
                        {badge.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Game Link
                </label>
                <input
                  type="url"
                  name="link"
                  value={editFormData.link}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., https://game.example.com"
                />
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={!editFormData.title || !editFormData.category}
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition shadow-sm disabled:bg-slate-400"
                >
                  Update Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesList;
