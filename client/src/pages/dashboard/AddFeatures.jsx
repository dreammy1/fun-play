import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { FaTrash, FaUpload, FaPlus, FaLink, FaSave } from "react-icons/fa";

export default function AddFeatures() {
  const { addToast } = useToasts();
  const [data, setData] = useState({
    featuresImageMobile: { image: "", links: [] },
    featuresImageDesktop: [],
    download: "",
    downloadApk: "",
    publish: "",
    desktop: "",
    jackpotImage: "",
    secondaryBannerImage: "",
    referImage: {
      image: "",
      title: "",
      description: "",
      btnColor: "",
      btnTextColor: "",
      text: "",
      referTextColor: "",
      link: "",
    },
    exclusiveImage: "",
    downloadImageForDesktop: "",
  });
  const [newLink, setNewLink] = useState("");
  const [desktopEntries, setDesktopEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({
    featuresImageMobile: false,
    download: false,
    downloadApk: false,
    publish: false,
    desktop: false,
    featuresImageDesktop: false,
    jackpotImage: false,
    secondaryBannerImage: false,
    referImage: false,
    exclusiveImage: false,
    downloadImageForDesktop: false,
  });
  const [docId, setDocId] = useState(null);
  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/features-image`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error === "No images found") {
            const initResponse = await fetch(`${baseURL}/features-image/init`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            });
            if (!initResponse.ok) {
              throw new Error("Failed to initialize document");
            }
            const initData = await initResponse.json();
            setDocId(initData.id);
            setData({
              featuresImageMobile: { image: "", links: [] },
              featuresImageDesktop: [],
              download: "",
              downloadApk: "",
              publish: "",
              desktop: "",
              jackpotImage: "",
              secondaryBannerImage: "",
              referImage: {
                image: "",
                title: "",
                description: "",
                btnColor: "",
                btnTextColor: "",
                text: "",
                referTextColor: "",
                link: "",
              },
              exclusiveImage: "",
              downloadImageForDesktop: "",
            });
          } else {
            throw new Error(errorData.error || "Failed to fetch data");
          }
        } else {
          const fetchedData = await response.json();
          setData({
            featuresImageMobile: fetchedData.featuresImageMobile || {
              image: "",
              links: [],
            },
            featuresImageDesktop: fetchedData.featuresImageDesktop || [],
            download: fetchedData.download || "",
            downloadApk: fetchedData.downloadApk || "",
            publish: fetchedData.publish || "",
            desktop: fetchedData.desktop || "",
            jackpotImage: fetchedData.jackpotImage || "",
            secondaryBannerImage: fetchedData.secondaryBannerImage || "",
            referImage: fetchedData.referImage || {
              image: "",
              title: "",
              description: "",
              btnColor: "",
              btnTextColor: "",
              text: "",
              referTextColor: "",
              link: "",
            },
            exclusiveImage: fetchedData.exclusiveImage || "",
            downloadImageForDesktop: fetchedData.downloadImageForDesktop || "",
          });
          setDocId(fetchedData._id || null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`Error: ${err.message}`, {
          appearance: "error",
          autoDismiss: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast, baseURL]);

  const handleFileUpload = async (e, field, isApk = false, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(isApk ? "apk" : "image", file);

    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const uploadResponse = await fetch(
        `${baseURL}/features-image/upload${isApk ? "-apk" : ""}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(
          errorData.error || `Failed to upload ${isApk ? "APK" : "image"}`
        );
      }
      const uploadData = await uploadResponse.json();
      const fileLink = uploadData.filePath;

      if (field === "featuresImageDesktop") {
        const updatedDesktopEntries = [...desktopEntries];
        updatedDesktopEntries[index] = {
          ...updatedDesktopEntries[index],
          image: fileLink,
        };
        setDesktopEntries(updatedDesktopEntries);
      } else {
        const updatePayload = {};
        if (field === "featuresImageMobile") {
          updatePayload.featuresImageMobile = {
            ...data.featuresImageMobile,
            image: fileLink,
          };
        } else if (field === "referImage") {
          updatePayload.referImage = { ...data.referImage, image: fileLink };
        } else {
          updatePayload[field] = fileLink;
        }

        const updateResponse = await fetch(
          `${baseURL}/features-image/${docId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || "Failed to update file");
        }
        setData((prev) => ({
          ...prev,
          [field]:
            field === "featuresImageMobile"
              ? { ...prev.featuresImageMobile, image: fileLink }
              : field === "referImage"
              ? { ...prev.referImage, image: fileLink }
              : fileLink,
        }));
      }
      addToast(`${isApk ? "APK" : "Image"} uploaded successfully`, {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Upload error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleReferTextUpdate = (field, value) => {
    // Update local state only
    setData((prev) => ({
      ...prev,
      referImage: { ...prev.referImage, [field]: value },
    }));
  };

  const handleReferSubmit = async () => {
    // Submit all referImage fields to the backend
    const updatePayload = {
      referImage: { ...data.referImage },
    };
    try {
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update refer image data");
      }
      addToast("Refer image data updated successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Refer image update error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleAddLink = async () => {
    if (!newLink) return;
    const updatedLinks = [...data.featuresImageMobile.links, newLink];
    try {
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featuresImageMobile: {
            ...data.featuresImageMobile,
            links: updatedLinks,
          },
        }),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update links");
      }
      setData((prev) => ({
        ...prev,
        featuresImageMobile: {
          ...prev.featuresImageMobile,
          links: updatedLinks,
        },
      }));
      setNewLink("");
      addToast("Link added successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Link update error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleDeleteLink = async (index) => {
    const updatedLinks = data.featuresImageMobile.links.filter(
      (_, i) => i !== index
    );
    try {
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featuresImageMobile: {
            ...data.featuresImageMobile,
            links: updatedLinks,
          },
        }),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update links");
      }
      setData((prev) => ({
        ...prev,
        featuresImageMobile: {
          ...prev.featuresImageMobile,
          links: updatedLinks,
        },
      }));
      addToast("Link deleted successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Link delete error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleAddDesktopEntry = () => {
    setDesktopEntries((prev) => [...prev, { image: "", link: "" }]);
  };

  const handleUpdateDesktopEntry = (index, field, value) => {
    const updatedDesktopEntries = [...desktopEntries];
    updatedDesktopEntries[index] = {
      ...updatedDesktopEntries[index],
      [field]: value,
    };
    setDesktopEntries(updatedDesktopEntries);
  };

  const handleSaveDesktopEntry = async (index) => {
    const entry = desktopEntries[index];
    if (!entry.image || !entry.link) {
      addToast("Both image and link are required to save the entry", {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }

    try {
      const updatedDesktopEntries = [...data.featuresImageDesktop, entry];
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featuresImageDesktop: updatedDesktopEntries }),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to save desktop entry");
      }
      setData((prev) => ({
        ...prev,
        featuresImageDesktop: updatedDesktopEntries,
      }));
      setDesktopEntries((prev) => prev.filter((_, i) => i !== index));
      addToast("Desktop entry saved successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Desktop entry save error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleDelete = async (field, isApk = false, index = null) => {
    if (!docId) return;
    try {
      const doc = await fetch(`${baseURL}/features-image`, {
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
      let filePath;
      if (field === "featuresImageMobile") {
        filePath = doc.featuresImageMobile.image;
      } else if (field === "featuresImageDesktop" && index !== null) {
        filePath = doc.featuresImageDesktop[index].image;
      } else if (field === "referImage") {
        filePath = doc.referImage.image;
      } else {
        filePath = doc[field];
      }
      if (filePath) {
        await fetch(`${baseURL}/delete`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filePath }),
        });
      }
      const updatePayload = {};
      if (field === "featuresImageMobile") {
        updatePayload.featuresImageMobile = {
          image: "",
          links: data.featuresImageMobile.links,
        };
      } else if (field === "featuresImageDesktop" && index !== null) {
        const updatedDesktopEntries = [...data.featuresImageDesktop];
        updatedDesktopEntries[index] = {
          ...updatedDesktopEntries[index],
          image: "",
        };
        updatePayload.featuresImageDesktop = updatedDesktopEntries;
      } else if (field === "referImage") {
        updatePayload.referImage = {
          image: "",
          title: data.referImage.title,
          description: data.referImage.description,
          btnColor: data.referImage.btnColor,
          btnTextColor: data.referImage.btnTextColor,
          text: data.referImage.text,
          referTextColor: data.referImage.referTextColor,
          link: data.referImage.link,
        };
      } else {
        updatePayload[field] = "";
      }
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(
          errorData.error || `Failed to delete ${isApk ? "APK" : "image"}`
        );
      }
      if (isApk) {
        setData((prev) => ({ ...prev, downloadApk: "" }));
      } else if (field === "featuresImageMobile") {
        setData((prev) => ({
          ...prev,
          featuresImageMobile: { ...prev.featuresImageMobile, image: "" },
        }));
      } else if (field === "featuresImageDesktop" && index !== null) {
        setData((prev) => ({
          ...prev,
          featuresImageDesktop: updatePayload.featuresImageDesktop,
        }));
      } else if (field === "referImage") {
        setData((prev) => ({ ...prev, referImage: updatePayload.referImage }));
      } else {
        setData((prev) => ({ ...prev, [field]: "" }));
      }
      addToast(`${isApk ? "APK" : "Image"} deleted successfully`, {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Delete error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleDeleteDesktopEntry = async (index) => {
    const updatedDesktopEntries = data.featuresImageDesktop.filter(
      (_, i) => i !== index
    );
    try {
      if (data.featuresImageDesktop[index].image) {
        await fetch(`${baseURL}/delete`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: data.featuresImageDesktop[index].image,
          }),
        });
      }
      const updateResponse = await fetch(`${baseURL}/features-image/${docId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featuresImageDesktop: updatedDesktopEntries }),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to delete desktop entry");
      }
      setData((prev) => ({
        ...prev,
        featuresImageDesktop: updatedDesktopEntries,
      }));
      addToast("Desktop entry deleted successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      console.error("Desktop entry delete error:", err);
      addToast(`Error: ${err.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const handleDeleteTempDesktopEntry = (index) => {
    setDesktopEntries((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Manage Feature Images
        </h2>
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[#14805e] p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top Banner -1
              </label>
              {data.featuresImageMobile.image ? (
                <div className="relative">
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.featuresImageMobile.image}`}
                    alt="Features Image Mobile"
                  />
                  <button
                    onClick={() => handleDelete("featuresImageMobile")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Features Image Mobile
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, "featuresImageMobile")
                      }
                      disabled={uploading.featuresImageMobile || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.featuresImageMobile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Links
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Enter link"
                    className="flex-1 p-2 border rounded-md"
                  />
                  <button
                    onClick={handleAddLink}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={!newLink}
                  >
                    <FaPlus />
                  </button>
                </div>
                {data.featuresImageMobile.links.length > 0 && (
                  <ul className="space-y-2">
                    {data.featuresImageMobile.links.map((link, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                        <button
                          onClick={() => handleDeleteLink(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border border-[#14805e] p-4 rounded-md relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jackpot Image
              </label>
              {data.jackpotImage ? (
                <>
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.jackpotImage}`}
                    alt="Jackpot Image"
                  />
                  <button
                    onClick={() => handleDelete("jackpotImage")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Jackpot Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "jackpotImage")}
                      disabled={uploading.jackpotImage || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.jackpotImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="border border-[#14805e] p-4 rounded-md relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Banner Image
              </label>
              {data.secondaryBannerImage ? (
                <>
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.secondaryBannerImage}`}
                    alt="Secondary Banner Image"
                  />
                  <button
                    onClick={() => handleDelete("secondaryBannerImage")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Secondary Banner Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, "secondaryBannerImage")
                      }
                      disabled={uploading.secondaryBannerImage || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.secondaryBannerImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="border border-[#14805e] p-4 rounded-md relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refer Image
              </label>
              {data.referImage.image ? (
                <>
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.referImage.image}`}
                    alt="Refer Image"
                  />
                  <button
                    onClick={() => handleDelete("referImage")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Refer Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "referImage")}
                      disabled={uploading.referImage || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.referImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={data.referImage.title}
                    onChange={(e) =>
                      handleReferTextUpdate("title", e.target.value)
                    }
                    placeholder="Enter title"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={data.referImage.description}
                    onChange={(e) =>
                      handleReferTextUpdate("description", e.target.value)
                    }
                    placeholder="Enter description"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Color
                  </label>
                  <input
                    type="color"
                    value={data.referImage.btnColor}
                    onChange={(e) =>
                      handleReferTextUpdate("btnColor", e.target.value)
                    }
                    className="w-full h-10 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text Color
                  </label>
                  <input
                    type="color"
                    value={data.referImage.btnTextColor}
                    onChange={(e) =>
                      handleReferTextUpdate("btnTextColor", e.target.value)
                    }
                    className="w-full h-10 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={data.referImage.text}
                    onChange={(e) =>
                      handleReferTextUpdate("text", e.target.value)
                    }
                    placeholder="Enter text"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link
                  </label>
                  <input
                    type="text"
                    value={data.referImage.link}
                    onChange={(e) =>
                      handleReferTextUpdate("link", e.target.value)
                    }
                    placeholder="Enter link"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refer Text Color
                  </label>
                  <input
                    type="color"
                    value={data.referImage.referTextColor}
                    onChange={(e) =>
                      handleReferTextUpdate("referTextColor", e.target.value)
                    }
                    className="w-full h-10 border rounded-md"
                  />
                </div>
                <button
                  onClick={handleReferSubmit}
                  className="mt-4 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
                >
                  Submit Refer Image Data
                </button>
              </div>
            </div>

            <div className="border border-[#14805e] p-4 rounded-md relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gift & Promotion Banner
              </label>
              {data.exclusiveImage ? (
                <>
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.exclusiveImage}`}
                    alt="Exclusive Image"
                  />
                  <button
                    onClick={() => handleDelete("exclusiveImage")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Exclusive Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "exclusiveImage")}
                      disabled={uploading.exclusiveImage || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.exclusiveImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="border border-[#14805e] p-4 rounded-md relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Download Banner & App
              </label>
              {data.downloadImageForDesktop ? (
                <>
                  <img
                    className="w-full h-40 object-cover rounded-md"
                    src={`${baseURL}${data.downloadImageForDesktop}`}
                    alt="Download Image for Desktop"
                  />
                  <button
                    onClick={() => handleDelete("downloadImageForDesktop")}
                    className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                  >
                    <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                  </button>
                </>
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                  <label className="cursor-pointer flex flex-col items-center">
                    <FaUpload className="text-2xl text-gray-500" />
                    <span className="text-sm text-gray-600 mt-2">
                      Upload Download Image for Desktop
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, "downloadImageForDesktop")
                      }
                      disabled={uploading.downloadImageForDesktop || !docId}
                    />
                  </label>
                </div>
              )}
              {uploading.downloadImageForDesktop && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="border border-[#14805e] p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video & BG Banner
              </label>
              <button
                onClick={handleAddDesktopEntry}
                className="mb-4 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FaPlus /> Add Desktop Entry
              </button>
              {data.featuresImageDesktop.map((entry, index) => (
                <div key={index} className="mb-4 p-4 border rounded-md">
                  <div className="relative">
                    {entry.image ? (
                      <>
                        <img
                          className="w-full h-40 object-cover rounded-md"
                          src={`${baseURL}${entry.image}`}
                          alt={`Features Image Desktop ${index + 1}`}
                        />
                        <button
                          onClick={() =>
                            handleDelete("featuresImageDesktop", false, index)
                          }
                          className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                        >
                          <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                        <label className="cursor-pointer flex flex-col items-center">
                          <FaUpload className="text-2xl text-gray-500" />
                          <span className="text-sm text-gray-600 mt-2">
                            Upload Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(
                                e,
                                "featuresImageDesktop",
                                false,
                                index
                              )
                            }
                            disabled={uploading.featuresImageDesktop || !docId}
                          />
                        </label>
                      </div>
                    )}
                    {uploading.featuresImageDesktop && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link
                    </label>
                    <input
                      type="url"
                      value={entry.link}
                      onChange={(e) =>
                        handleUpdateDesktopEntry(index, "link", e.target.value)
                      }
                      placeholder="Enter link"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteDesktopEntry(index)}
                    className="mt-2 p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Entry
                  </button>
                </div>
              ))}
              {desktopEntries.map((entry, index) => (
                <div
                  key={`temp-${index}`}
                  className="mb-4 p-4 border rounded-md"
                >
                  <div className="relative">
                    {entry.image ? (
                      <>
                        <img
                          className="w-full h-40 object-cover rounded-md"
                          src={`${baseURL}${entry.image}`}
                          alt={`Temporary Desktop Image ${index + 1}`}
                        />
                        <button
                          onClick={() =>
                            handleUpdateDesktopEntry(index, "image", "")
                          }
                          className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                        >
                          <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                        <label className="cursor-pointer flex flex-col items-center">
                          <FaUpload className="text-2xl text-gray-500" />
                          <span className="text-sm text-gray-600 mt-2">
                            Upload Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(
                                e,
                                "featuresImageDesktop",
                                false,
                                index
                              )
                            }
                            disabled={uploading.featuresImageDesktop || !docId}
                          />
                        </label>
                      </div>
                    )}
                    {uploading.featuresImageDesktop && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link
                    </label>
                    <input
                      type="url"
                      value={entry.link}
                      onChange={(e) =>
                        handleUpdateDesktopEntry(index, "link", e.target.value)
                      }
                      placeholder="Enter link"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleSaveDesktopEntry(index)}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <FaSave /> Save Entry
                    </button>
                    <button
                      onClick={() => handleDeleteTempDesktopEntry(index)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <FaTrash /> Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {["download", "publish", "desktop"].map((field) => (
              <div
                key={field}
                className="border border-[#14805e] p-4 rounded-md relative"
              >
                <label className="block text-sm font-medium text-gray-700 capitalize mb-2">
                  {field} {field === "download" ? "Image/APK" : "Image"}
                </label>
                {field === "download" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Download APK
                    </label>
                    {data.downloadApk ? (
                      <div className="flex items-center gap-4">
                        <a
                          href={`${baseURL}${data.downloadApk}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View APK
                        </a>
                        <button
                          onClick={() => handleDelete("downloadApk", true)}
                          className="p-2 rounded-full bg-red-600 hover:bg-white duration-200"
                        >
                          <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <FaUpload className="text-2xl text-gray-500" />
                        <span className="text-sm text-gray-600 mt-2">
                          Upload APK
                        </span>
                        <input
                          type="file"
                          accept=".apk"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, "downloadApk", true)
                          }
                          disabled={uploading.download || !docId}
                        />
                      </label>
                    )}
                  </div>
                )}
                {data[field] ? (
                  <>
                    <img
                      className="w-full h-40 object-cover rounded-md"
                      src={`${baseURL}${data[field]}`}
                      alt={field}
                    />
                    <button
                      onClick={() => handleDelete(field)}
                      className="absolute top-2 right-2 p-2 group rounded-full bg-red-600 hover:bg-white duration-200"
                    >
                      <FaTrash className="text-xl text-white group-hover:text-red-600 duration-200" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                    <label className="cursor-pointer flex flex-col items-center">
                      <FaUpload className="text-2xl text-gray-500" />
                      <span className="text-sm text-gray-600 mt-2 capitalize">
                        {field} Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, field)}
                        disabled={uploading[field] || !docId}
                      />
                    </label>
                  </div>
                )}
                {uploading[field] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
