// Updated Frontend Component: UploadGameAutomation.jsx

import { useState, useEffect } from "react";
import { useGetCategoriesQuery } from "@/redux/features/allApis/categoriesApi/categoriesApi";
import { useAddGameMutation } from "@/redux/features/allApis/gameApi/gameApi";
import { useToasts } from "react-toast-notifications";
import axios from "axios";

const UploadGameAutomation = () => {
  const { data: subcategories = [] } = useGetCategoriesQuery();
  const [addGame, { isLoading: isBulkLoading }] = useAddGameMutation();
  const { addToast } = useToasts();
  const [bulkFormData, setBulkFormData] = useState({
    category: "",
    subcategory: "",
    htmlString: "",
    jsonInput: "",
  });
  const [uploadProgress, setUploadProgress] = useState([]);
  const [errors, setErrors] = useState({});

  const categories = [
    { label: "ক্রিকেট", value: "cricket" },
    { label: "ক্যাসিনো", value: "casino" },
    { label: "স্লট", value: "slot" },
    { label: "টেবিল খেলা", value: "table" },
    { label: "এসবি", value: "sb" },
    { label: "মাছ ধরা", value: "fishing" },
    { label: "ক্র্যাশ", value: "crash" },
  ];

  // ফিল্টার করা সাবক্যাটাগরি
  const filteredSubcategories = subcategories.filter(
    (subcat) => subcat.category === bulkFormData.category
  );

  // ক্যাটাগরি পরিবর্তনের সময় প্রথম সাবক্যাটাগরি অটো-সিলেক্ট করা
  useEffect(() => {
    if (filteredSubcategories.length > 0 && !bulkFormData.subcategory) {
      setBulkFormData((prev) => ({
        ...prev,
        subcategory: filteredSubcategories[0]?.value || "",
      }));
    }
  }, [bulkFormData.category, filteredSubcategories]);

  // HTML থেকে গেমের নাম এবং ইমেজ URL পার্স করা
  const extractGamesFromHTML = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const gameElements = doc.querySelectorAll(".slot-game-card-item");
    const games = [];

    gameElements.forEach((element) => {
      const name = element.querySelector(".slot-game-name-box")?.textContent.trim();
      const imgStyle = element.querySelector(".v-image__image--cover")?.style.backgroundImage;
      let img = imgStyle ? imgStyle.replace(/^url\(['"](.+)['"]\)$/, "$1") : null;

      // যদি img URL না থাকে, অথবা রিলেটিভ হয়, তাহলে স্কিপ বা হ্যান্ডেল করুন (এখানে অ্যাসুম করছি ফুল URL আসবে)
      if (name && img) {
        games.push({ name, img });
      }
    });

    return games;
  };

  // ব্যাকএন্ড থেকে ইমেজ ডাউনলোড এবং সেভ করে পাথ রিটার্ন করা
  const downloadAndSaveImage = async (url) => {
    try {
      const response = await axios.post("https://newapi.gamebaji71.com/games/image-download", { imageUrl: url });
      return response.data.filePath; // ব্যাকএন্ড থেকে সেভ করা পাথ রিটার্ন
    } catch (error) {
      console.error("Image download failed:", error);
      setUploadProgress((prev) => [
        ...prev,
        `ইমেজ ডাউনলোড ব্যর্থ: ${error.response?.data?.error || error.message}`,
      ]);
      return null;
    }
  };

  // ইনপুট পরিবর্তন হ্যান্ডল করা
  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData({
      ...bulkFormData,
      [name]: value,
      ...(name === "category" ? { subcategory: "" } : {}),
    });
  };

  // ফর্ম সাবমিট হ্যান্ডল করা
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setUploadProgress([]);

    const validationErrors = {};
    if (!bulkFormData.category) validationErrors.category = "ক্যাটাগরি নির্বাচন করুন";
    if (filteredSubcategories.length > 0 && !bulkFormData.subcategory) {
      validationErrors.subcategory = "সাবক্যাটাগরি নির্বাচন করুন";
    }
    if (!bulkFormData.htmlString.trim()) validationErrors.htmlString = "HTML স্ট্রিং দিন";
    if (!bulkFormData.jsonInput.trim()) validationErrors.jsonInput = "JSON ইনপুট দিন";

    let jsonInputParsed;
    try {
      jsonInputParsed = JSON.parse(bulkFormData.jsonInput);
      if (!Array.isArray(jsonInputParsed)) {
        validationErrors.jsonInput = "JSON অবশ্যই একটা অ্যারে হতে হবে";
      }
    } catch (error) {
      validationErrors.jsonInput = "ইনপুট JSON বৈধ নয়";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const htmlGames = extractGamesFromHTML(bulkFormData.htmlString);

    // MongoDB তে বিদ্যমান gameID চেক করা (ব্যাকএন্ড থেকে সব গেম ফেচ করে)
    let existingGamesResponse;
    try {
      existingGamesResponse = await axios.get("https://newapi.gamebaji71.com/games");
    } catch (error) {
      setUploadProgress((prev) => [...prev, "বিদ্যমান গেম চেক করতে ব্যর্থ"]);
      return;
    }
    const existingGameIDs = existingGamesResponse.data.map((game) => game.gameID);

    // গেম ফিল্টার এবং আপলোড
    for (const jsonGame of jsonInputParsed) {
      if (existingGameIDs.includes(jsonGame.id)) {
        setUploadProgress((prev) => [
          ...prev,
          `গেম "${jsonGame.name}" (ID: ${jsonGame.id}) ইতিমধ্যে আছে, স্কিপ করা হলো`,
        ]);
        continue;
      }

      const htmlGame = htmlGames.find((game) => game.name.trim() == jsonGame.name.trim());
      if (!htmlGame || !htmlGame.img) {
        setUploadProgress((prev) => [
          ...prev,
          `গেম "${jsonGame.name}" HTML এ মিলেনি বা ইমেজ নেই, স্কিপ করা হলো`,
        ]);
        continue;
      }

      // ইমেজ ডাউনলোড এবং সেভ
      const imagePath = await downloadAndSaveImage(htmlGame.img);
      if (!imagePath) {
        setUploadProgress((prev) => [
          ...prev,
          `গেম "${jsonGame.name}" এর ইমেজ ডাউনলোড ব্যর্থ, স্কিপ করা হলো`,
        ]);
        continue;
      }

      // গেম ডেটা তৈরি
      const gameData = {
        title: jsonGame.name,
        category: bulkFormData.category,
        subcategory: bulkFormData.subcategory,
        image: imagePath, // ব্যাকএন্ড থেকে পাওয়া পাথ
        link: "", // অপশনাল, ডিফল্ট খালি
        badge: "", // অপশনাল, HTML থেকে চেক করে সেট করতে পারেন যদি দরকার হয় (যেমন new_icon_sizing চেক)
        gameID: jsonGame.id,
        provider: jsonGame.provider || "unknown",
      };

      // যদি HTML img এ "new_icon_sizing" থাকে, তাহলে badge = "new"
      if (htmlGame.img.includes("new_icon_sizing")) {
        gameData.badge = "new";
      }

      // addGame দিয়ে DB তে সেভ
      const result = await addGame(gameData);
      if (result.error) {
        setUploadProgress((prev) => [
          ...prev,
          `গেম "${jsonGame.name}" আপলোড ব্যর্থ: ${result.error.data.message}`,
        ]);
      } else {
        setUploadProgress((prev) => [
          ...prev,
          `গেম "${jsonGame.name}" সফলভাবে আপলোড হয়েছে`,
        ]);
        addToast(`গেম "${jsonGame.name}" সফলভাবে আপলোড হয়েছে`, {
          appearance: "success",
          autoDismiss: true,
        });
      }
    }

    addToast("বাল্ক আপলোড প্রক্রিয়া সম্পন্ন", {
      appearance: "info",
      autoDismiss: true,
    });
  };

  return (
    <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">বাল্ক গেম আপলোড (অটোমেশন)</h1>

      <form onSubmit={handleBulkSubmit}>
        {/* Category Select */}
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            ক্যাটাগরি নির্বাচন করুন
          </label>
          <select
            id="category"
            name="category"
            value={bulkFormData.category}
            onChange={handleBulkInputChange}
            className={`block w-full px-3 py-2 border ${
              errors.category ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">ক্যাটাগরি নির্বাচন করুন</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Subcategory Select (conditional) */}
        {filteredSubcategories.length > 0 && (
          <div className="mb-6">
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
              সাবক্যাটাগরি নির্বাচন করুন
            </label>
            <select
              id="subcategory"
              name="subcategory"
              value={bulkFormData.subcategory}
              onChange={handleBulkInputChange}
              className={`block w-full px-3 py-2 border ${
                errors.subcategory ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            >
              <option value="">সাবক্যাটাগরি নির্বাচন করুন</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory?.value}>
                  {subcategory.title}
                </option>
              ))}
            </select>
            {errors.subcategory && (
              <p className="mt-1 text-sm text-red-600">{errors.subcategory}</p>
            )}
          </div>
        )}

        {/* HTML String Input */}
        <div className="mb-6">
          <label htmlFor="htmlString" className="block text-sm font-medium text-gray-700 mb-2">
            HTML স্ট্রিং (গেম পার্স করার জন্য)
          </label>
          <textarea
            id="htmlString"
            name="htmlString"
            value={bulkFormData.htmlString}
            onChange={handleBulkInputChange}
            rows={5}
            className={`block w-full px-3 py-2 border ${
              errors.htmlString ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="এখানে HTML স্ট্রিং পেস্ট করুন..."
          />
          {errors.htmlString && (
            <p className="mt-1 text-sm text-red-600">{errors.htmlString}</p>
          )}
        </div>

        {/* JSON Input */}
        <div className="mb-6">
          <label htmlFor="jsonInput" className="block text-sm font-medium text-gray-700 mb-2">
            JSON ইনপুট (গেমের অ্যারে)
          </label>
          <textarea
            id="jsonInput"
            name="jsonInput"
            value={bulkFormData.jsonInput}
            onChange={handleBulkInputChange}
            rows={5}
            className={`block w-full px-3 py-2 border ${
              errors.jsonInput ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder='এখানে JSON অ্যারে পেস্ট করুন, যেমন: [{"name": "Game1", "id": "id1", "provider": "provider1"}]'
          />
          {errors.jsonInput && (
            <p className="mt-1 text-sm text-red-600">{errors.jsonInput}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            disabled={isBulkLoading}
            type="submit"
            className="px-4 py-2 bg-indigo-600 disabled:bg-slate-400 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            সব গেম আপলোড করুন (অটোমেটেড)
          </button>
        </div>
      </form>

      {/* Progress and Logs */}
      {uploadProgress.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">আপলোড প্রোগ্রেস</h2>
          <ul className="list-disc pl-5">
            {uploadProgress.map((log, index) => (
              <li key={index} className="text-sm text-gray-700">
                {log}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadGameAutomation;