import { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";

const ImageVideoSlider = () => {
  const { addToast } = useToasts();
  const [slides, setSlides] = useState([]);
  const [featuresImage, setFeaturesImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:5000";

  // Fallback image
  const fallbackImage = "https://via.placeholder.com/800x320?text=No+Image";

  // Fetch featuresImageMobile data
  useEffect(() => {
    const fetchFeaturesImage = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/features-image`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch features image");
        }
        const data = await response.json();
        const mobileData = data.featuresImageMobile || { image: "", links: [] };
        setFeaturesImage(mobileData.image ? `${baseURL}${mobileData.image}` : "");
        // Map links to slides
        const formattedSlides = mobileData.links.map((link, index) => ({
          id: index + 1,
          videoId: link || "",
        }));
        setSlides(formattedSlides);
      } catch (err) {
        console.error("Fetch error:", err);
        addToast(`Error: ${err.message}`, { appearance: "error", autoDismiss: true });
        setFeaturesImage("");
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturesImage();
  }, [addToast, baseURL]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (slides.length === 0) return; // Skip if no slides
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

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

  const currentSlide = slides[currentIndex] || { id: 1, videoId: "" };

  return (
    <div className="relative w-full max-w-4xl mx-auto md:hidden">
      {/* Image section with relative positioning for buttons */}
      <div className="relative">
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-t-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : featuresImage ? (
          <div className={`transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-90"}`}>
            <img
              className="w-full h-64 object-cover rounded-t-xl"
              src={featuresImage}
              alt={`Slide ${currentSlide.id}`}
           //   onError={(e) => (e.target.src = fallbackImage)} // Fallback on image error
            />
          </div>
        ) : (
          <div>
            
          </div>
        )}

        {/* Navigation buttons positioned at bottom-left of image */}
        {slides.length > 0 && (
          <div className="absolute bottom-2 left-2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentIndex === index ? "bg-yellow-500" : "bg-white"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video section (bottom) */}
      <div
        className={`bg-gray-900 rounded-xl overflow-hidden transition-opacity duration-300 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {slides.length === 0 ? (
          <div>
          
          </div>
        ) : currentSlide.videoId && extractYouTubeId(currentSlide.videoId) ? (
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              className="w-full h-64 rounded-xl"
              src={`https://www.youtube.com/embed/${extractYouTubeId(currentSlide.videoId)}`}
              title={`YouTube video ${currentSlide.id}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-900 rounded-xl">
            <p className="text-gray-400 text-sm">Invalid or no video available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageVideoSlider;