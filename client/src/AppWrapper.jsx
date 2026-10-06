import { useEffect, useState, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import Router from "./routes/Router.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useToasts } from "react-toast-notifications";
import { fetchThemeColors } from "./redux/slices/themeColorSlice";
import { useGetHomeControlsQuery } from "./redux/features/allApis/homeControlApi/homeControlApi";
import useSyncUser from "./hooks/useSyncUser";
import { setCredentials } from "./redux/slices/authSlice";

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { addToast } = useToasts();

  useEffect(() => {
    const localUser = localStorage.getItem("user");
    const localToken = localStorage.getItem("token");

    if (localUser && localToken) {
      const user = JSON.parse(localUser);

      fetch(
        `${import.meta.env.VITE_BASE_API_URL}/users/single-user/${user._id}`
      )
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data));
          localStorage.setItem("token", localToken);

          dispatch(
            setCredentials({
              user: data,
              token: localToken,
            })
          );
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
        });
    }
  }, [dispatch]);

  useSyncUser();

  const { loading: themeLoading, error: themeError } = useSelector(
    (state) => state.themeColor
  );
  const {
    data: homeControls,
    isLoading: homeControlsLoading,
    isError,
    error: homeControlsError,
  } = useGetHomeControlsQuery();
  const [loadingImageUrl, setLoadingImageUrl] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const loadingTimer = useRef(null);

  const loadingImageControl = homeControls?.find(
    (control) => control.category === "loading-image" && control.isSelected
  );

  // থিম এবং হোম কন্ট্রোল ফেচ এবং এরর হ্যান্ডলিং
  useEffect(() => {
    dispatch(fetchThemeColors());

    if (themeError) {
      addToast(`থিম লোড করতে ত্রুটি: ${themeError}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }

    if (isError) {
      addToast("হোম কন্ট্রোল লোড করতে ত্রুটি হয়েছে, পেজ রিলোড হচ্ছে...", {
        appearance: "error",
        autoDismiss: true,
      });

      const reloadCount = parseInt(localStorage.getItem("reloadCount") || "0");
      if (reloadCount < 3) {
        localStorage.setItem("reloadCount", reloadCount + 1);
        const reloadTimeout = setTimeout(() => {
          window.location.reload();
        }, 2000);
        return () => clearTimeout(reloadTimeout);
      } else {
        addToast("একাধিক ত্রুটি, দয়া করে সাপোর্টে যোগাযোগ করুন", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    } else {
      localStorage.setItem("reloadCount", "0");
    }
  }, [dispatch, themeError, isError, homeControlsError, addToast]);

  // লোডিং ইমেজ হ্যান্ডলিং
  useEffect(() => {
    // নিশ্চিত করুন যে homeControls লোড হয়েছে
    if (homeControlsLoading) return;

    if (loadingImageControl?.image) {
      const imageUrl = `${import.meta.env.VITE_BASE_API_URL}${
        loadingImageControl.image
      }`;
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setLoadingImageUrl(imageUrl);
        loadingTimer.current = setTimeout(() => {
          setShowContent(true);
        }, 2000);
      };
      img.onerror = () => {
        loadingTimer.current = setTimeout(() => {
          setShowContent(true);
        }, 2000);
      };
    } else {
      loadingTimer.current = setTimeout(() => {
        setShowContent(true);
      }, 2000);
    }

    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, [loadingImageControl, homeControlsLoading]);

  // থিম বা হোম কন্ট্রোল লোডিং হলে লোডিং স্ক্রিন দেখানো
  if (themeLoading || homeControlsLoading || !showContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        {loadingImageUrl && (
          <div className="text-center">
            <img
              src={loadingImageUrl}
              alt="Loading"
              className="w-40 mx-auto mt-6"
            />
          </div>
        )}
      </div>
    );
  }

  // কন্টেন্ট দেখানো
  return <RouterProvider router={Router} />;
};

export default AppWrapper;
