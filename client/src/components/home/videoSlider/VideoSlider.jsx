import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";

const VideoSlider = () => {
  const { addToast } = useToasts();
  const [bannerImages, setBannerImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fallback image (optional, you can replace with a real placeholder image)
  const fallbackImage = "https://via.placeholder.com/800x320?text=No+Image";

  // Fetch featuresImageDesktop data
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
          throw new Error("Failed to fetch features image data");
        }
        const data = await response.json();
        const desktopImages = data.featuresImageDesktop || [];
        // Map data to match bannerImages structure
        const formattedImages = desktopImages.map((item, index) => ({
          id: index + 1,
          image: item.image && `${baseURL}${item.image}` ,
          videoId: item.link || "",
        }));
        setBannerImages(formattedImages);
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`Error: ${err.message}`, { appearance: "error", autoDismiss: true });
        setBannerImages([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast, baseURL]);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (bannerImages.length === 0) return; // Skip if no images
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
        setFade(true);
      }, 300); // Matches transition duration
    }, 3000);

    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const goToSlide = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 300);
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div


      style={{ display: bannerImages.length !== 0 ? "block" : "none" }}
    
      
    className="relative w-full h-80 hidden md:block">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-600">Loading...</p>
        </div>
      ) : bannerImages.length !== 0 && (
        <>
          {/* Main content with fade transition */}
          <div
            className={`relative h-full transition-opacity duration-300 ${
              fade ? "opacity-100" : "opacity-90"
            }`}
          >
            <img
              className="h-full w-full object-fit rounded-lg"
              src={bannerImages[currentIndex].image}
              alt={`Banner ${bannerImages[currentIndex].id}`}
             // onError={(e) => (e.target.src = fallbackImage)} // Fallback on image error
            />
            {bannerImages[currentIndex].videoId && (
              <iframe
                className="absolute py-4 h-full w-[40%] bottom-0 right-0 rounded-md"
                src={getYouTubeEmbedUrl(bannerImages[currentIndex].videoId)}
                title={`YouTube video ${extractYouTubeId(bannerImages[currentIndex].videoId)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="absolute bottom-4 left-8 flex space-x-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`size-[10px] md:size-4 rounded-full hover:bg-yellow-400 transition-colors ease-in-out duration-300 ${
                  currentIndex === index ? "bg-yellow-400" : "bg-white"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoSlider;