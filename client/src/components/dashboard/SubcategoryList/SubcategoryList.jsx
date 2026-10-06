import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/features/allApis/categoriesApi/categoriesApi";
import { useState, useEffect } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiChevronDown,
  FiX,
} from "react-icons/fi";
import { useToasts } from "react-toast-notifications";
import { uploadImage } from "@/hooks/files";

const SubcategoryList = () => {
  const { data: subcategories, isLoading: isFetching } =
    useGetCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const { addToast } = useToasts();

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    image: null,
    imagePreview: null,
    iconImage: null,
    iconImagePreview: null,
    category: "",
    provider: "",
    oldImage: null,
    oldIconImage: null,
  });
  const [providers, setProviders] = useState([]);
  // Fetch providers for edit modal
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
        /* ignore */
      }
    };
    fetchProviders();
  }, []);

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const categories = [
    { label: "ক্রিকেট", value: "cricket" },
    { label: "ক্যাসিনো", value: "casino" },
    { label: "স্লট", value: "slot" },
    { label: "টেবিল খেলা", value: "table" },
    { label: "এসবি", value: "sb" },
    { label: "মাছ ধরা", value: "fishing" },
    { label: "ক্র্যাশ", value: "crash" },
  ];

  const handleEdit = (subcategory) => {
    setEditFormData({
      id: subcategory._id,
      image: null,
      imagePreview: `${import.meta.env.VITE_BASE_API_URL}${subcategory.image}`,
      iconImage: null,
      iconImagePreview: subcategory.iconImage
        ? `${import.meta.env.VITE_BASE_API_URL}${subcategory.iconImage}`
        : null,
      category: subcategory.category,
      provider:
        typeof subcategory.provider === "object"
          ? subcategory.provider._id
          : subcategory.provider,
      oldImage: subcategory.image,
      oldIconImage: subcategory.iconImage || null,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (subcategory) => {
    setCategoryToDelete(subcategory);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const result = await deleteCategory(categoryToDelete._id).unwrap();
      if (result.deletedCount > 0) {
        addToast("Subcategory deleted successfully", {
          appearance: "success",
          autoDismiss: true,
        });
      }
    } catch (error) {
      addToast(error.data?.message || "Failed to delete subcategory", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" || name === "iconImage") {
      const file = files[0];
      if (file) {
        setEditFormData({
          ...editFormData,
          [name]: file,
          [name === "image" ? "imagePreview" : "iconImagePreview"]:
            URL.createObjectURL(file),
        });
      }
    } else {
      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // console.log("Submitting with ID:", editFormData.id);
    // console.log("editFormData:", editFormData);

    if (!editFormData.id) {
      addToast("Invalid category ID", {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }

    const updateData = {
      category: editFormData.category,
      provider: editFormData.provider,
    };

    try {
      // Upload new images and delete old ones if provided
      if (editFormData.image && editFormData.oldImage) {
        //   console.log("Deleting old image:", editFormData.oldImage);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_API_URL}/delete`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ filePath: editFormData.oldImage }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete old image");
          }
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
      if (editFormData.iconImage) {
        //  console.log("Uploading new iconImage");
        if (editFormData.oldIconImage) {
          //   console.log("Deleting old iconImage:", editFormData.oldIconImage);
          try {
            const response = await fetch(
              `${import.meta.env.VITE_BASE_API_URL}/delete`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ filePath: editFormData.oldIconImage }),
              }
            );
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message || "Failed to delete old icon image"
              );
            }
          } catch (err) {
            console.error("Failed to delete old iconImage:", err);
            addToast(`Failed to delete old icon image: ${err.message}`, {
              appearance: "warning",
              autoDismiss: true,
            });
          }
        }
        const { filePath } = await uploadImage(editFormData.iconImage);
        updateData.iconImage = filePath;
      }

      // console.log("Sending update request with:", { id: editFormData.id, ...updateData });
      const result = await updateCategory({
        id: editFormData.id,
        ...updateData,
      }).unwrap();
      if (result.modifiedCount > 0) {
        addToast("Subcategory updated successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        setIsEditModalOpen(false);
        setEditFormData({
          id: "",
          image: null,
          imagePreview: null,
          iconImage: null,
          iconImagePreview: null,
          category: "",
          value: "",
          title: "",
          oldImage: null,
          oldIconImage: null,
        });
      } else {
        addToast("No changes made to the subcategory", {
          appearance: "warning",
          autoDismiss: true,
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      addToast(
        error.data?.message || `Failed to update subcategory: ${error.message}`,
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
        🎮 Game Subcategory List
      </h2>

      {isFetching ? (
        <p className="text-center text-gray-500">Loading subcategories...</p>
      ) : subcategories?.length === 0 ? (
        <p className="text-center text-gray-500">No subcategories available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {subcategories?.map((sub, index) => (
            <div
              key={index}
              className="relative bg-white rounded-xl shadow hover:shadow-md transition duration-200 border border-gray-200 overflow-hidden"
            >
              {/* Actions - top right */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button
                  onClick={() => handleEdit(sub)}
                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full bg-blue-50 hover:bg-blue-200 transition"
                  title="Edit"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(sub)}
                  className="text-red-600 hover:text-red-800 p-1.5 rounded-full bg-red-50 hover:bg-red-200 transition"
                  title="Delete"
                  disabled={isDeleting}
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Images */}
              <div className="h-32 bg-gray-100 relative">
                <img
                  src={`${import.meta.env.VITE_BASE_API_URL}${sub.image}`}
                  alt={sub.title}
                  className="w-full h-full object-cover object-center"
                />
                {sub?.iconImage && (
                  <img
                    src={`${import.meta.env.VITE_BASE_API_URL}${
                      sub?.iconImage
                    }`}
                    alt={`${sub.title} icon`}
                    className="absolute bottom-2 left-2 h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-1">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {sub.title}
                </h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span>{" "}
                  {categories.find((cat) => cat.value === sub.category)
                    ?.label || sub.category}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Provider:</span>{" "}
                  {sub.provider?.name || sub.provider}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

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
              Edit Subcategory
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
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
                      onChange={handleEditChange}
                      className="hidden"
                    />
                  </label>
                  {editFormData.iconImagePreview && (
                    <img
                      src={editFormData.iconImagePreview}
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

              {/* Provider Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Provider
                </label>
                <div className="relative">
                  <select
                    name="provider"
                    value={editFormData.provider}
                    onChange={handleEditChange}
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
                    isUpdating ||
                    !editFormData.category ||
                    !editFormData.provider
                  }
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition shadow-sm disabled:bg-slate-400"
                >
                  Update Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCategoryToDelete(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete the subcategory{" "}
              <span className="font-semibold">
                &quot;{categoryToDelete?.title}&quot;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoryList;
