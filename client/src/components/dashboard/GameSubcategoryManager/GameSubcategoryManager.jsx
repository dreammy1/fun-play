import { uploadImage } from "@/hooks/files";
import { useAddCategoryMutation } from "@/redux/features/allApis/categoriesApi/categoriesApi";
import { useState, useEffect } from "react";
import { FiUpload, FiChevronDown } from "react-icons/fi";
import { useToasts } from "react-toast-notifications";

const GameSubcategoryManager = () => {
  const [addSubcategory, { isLoading }] = useAddCategoryMutation();
  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    iconImage: null,
    iconImagePreview: null,
    category: "",
    provider: "",
  });
  const [providers, setProviders] = useState([]);
  const { addToast } = useToasts();

  const categories = [
    { label: "ক্রিকেট", value: "cricket" },
    { label: "ক্যাসিনো", value: "casino" },
    { label: "স্লট", value: "slot" },
    { label: "টেবিল খেলা", value: "table" },
    { label: "এসবি", value: "sb" },
    { label: "মাছ ধরা", value: "fishing" },
    { label: "ক্র্যাশ", value: "crash" },
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" || name === "iconImage") {
      const file = files[0];
      if (file) {
        setFormData({
          ...formData,
          [name]: file,
          [name === "image" ? "imagePreview" : "iconImagePreview"]:
            URL.createObjectURL(file),
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Fetch providers on mount
  useEffect(() => {
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
        if (data.success) setProviders(data.data);
      } catch {
        // Optionally handle error
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { filePath: imagePath } = await uploadImage(formData.image);
    const { filePath: iconImagePath } = await uploadImage(formData.iconImage);
    const info = {
      image: imagePath,
      iconImage: iconImagePath,
      category: formData.category,
      provider: formData.provider, // Save provider ID only
    };

    const result = await addSubcategory(info);
    if (result.error) {
      addToast(result.error.data.message, {
        appearance: "error",
        autoDismiss: true,
      });
    } else if (result.data.insertedId) {
      addToast("Subcategory added successfully", {
        appearance: "success",
        autoDismiss: true,
      });
      setFormData({
        image: null,
        imagePreview: null,
        iconImage: null,
        iconImagePreview: null,
        category: "",
        provider: "",
      });
    }
  };

  return (
    <div className="md:w-1/4 w-full bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        🎮 Add Game Subcategory
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload with Preview */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subcategory Image
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition">
              <FiUpload className="text-lg" />
              Upload Image
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                required
              />
            </label>
            {formData.imagePreview && (
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="h-16 w-16 rounded object-cover border border-gray-200"
              />
            )}
          </div>
        </div>

        {/* Icon Image Upload with Preview */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subcategory Icon Image
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition">
              <FiUpload className="text-lg" />
              Upload Icon Image
              <input
                type="file"
                name="iconImage"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                required
              />
            </label>
            {formData.iconImagePreview && (
              <img
                src={formData.iconImagePreview}
                alt="Icon Preview"
                className="h-16 w-16 rounded object-cover border border-gray-200"
              />
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
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

        {/* Provider Dropdown (was Subcategory Title) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Provider
          </label>
          <div className="relative">
            <select
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Select a provider</option>
              {providers.map((prov) => (
                <option key={prov._id} value={prov._id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={
              isLoading ||
              !formData.category ||
              !formData.provider ||
              !formData.image ||
              !formData.iconImage
            }
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition shadow-sm disabled:bg-slate-400"
          >
            Save Subcategory
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameSubcategoryManager;
