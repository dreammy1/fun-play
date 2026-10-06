import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setCredentials } from "../redux/slices/authSlice";

// Call this in your App/AppWrapper to always sync user info
const useSyncUser = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUser = async () => {
      if (user && user._id && token) {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BASE_API_URL}/users/single-user/${
              user._id
            }`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.data && res.data.user) {
            console.log("Fetched user:", res.data.user);

            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("token", token);

            dispatch(
              setCredentials({
                token,
                user: res.data.user,
              })
            );
          }
        } catch (err) {
          // Optionally handle error (logout, etc)
        }
      }
    };
    fetchUser();
    // Only run on mount or if user/token changes
    // eslint-disable-next-line
  }, [user?._id, token]);
};

export default useSyncUser;
