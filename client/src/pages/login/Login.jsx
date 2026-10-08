import {
  useLazyGetAuthenticatedUserQuery,
  useLoginUserMutation,
} from "@/redux/features/allApis/usersApi/usersApi";
import { logout, setCredentials } from "@/redux/slices/authSlice";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "react-toast-notifications";

const Login = () => {
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [getUser] = useLazyGetAuthenticatedUserQuery();
  const dispatch = useDispatch();
  const { addToast } = useToasts();
  const navigate = useNavigate();

    const { mainColor , backgroundColor } = useSelector((state) => state.themeColor);


  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const loginData = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      }).unwrap();

      if (!loginData?.token) {
        throw new Error("লগইন করা যায়নি। ব্যবহারকারীর নাম ও পাসওয়ার্ড যাচাই করুন।");
      }

      const userData = await getUser(loginData.token).unwrap();

      if (userData?.role !== "user") {
        dispatch(logout());
        localStorage.removeItem("token");
        throw new Error("এই অ্যাকাউন্টটি গ্রাহক লগইনের জন্য নয়।");
      }

      dispatch(setCredentials({ token: loginData.token, user: userData }));
      addToast("Login successful", {
        appearance: "success",
        autoDismiss: true,
      });
      setFormData({ username: "", password: "" });
      navigate("/profile/deposit");
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        "লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      addToast(message, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  return (
    <div>
      <div className="bg-[#ebebeb]">
        <h2 className="text-2xl text-center font-semibold pt-10 text-[#333]">
          প্রবেশ করুন
        </h2>
        <p className="text-sm text-center lg:text-base text-[#333]">স্বাগতম!</p>
        <div className="max-w-[440px] mx-auto py-6 pb-16">
          <form
            className="bg-[#ebebeb] sm:bg-white p-8 sm:p-10"
            onSubmit={handleSubmit}
          >
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                ব্যবহারকারীর নাম <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="username"
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="এখানে পূরণ করুন"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                গোপন নম্বর <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="password"
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="এখানে পূরণ করুন"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: backgroundColor , color: mainColor }}
              className="text-base text-black transition-all duration-500 focus:outline-none font-medium rounded-lg w-full px-5 py-2.5 text-center"
            >
              {isLoading ? "অপেক্ষা করুন..." : "প্রবেশ করুন"}
            </button>
            <Link>
              <p className="mt-6 text-sm text-center text-blue-500 underline">
                পাসওয়ার্ড ভুলে গেছেন
              </p>
            </Link>
            <p className="text-sm text-center text-[#333] pb-4">
              কোনো একাউন্ট এখনও নেই?{" "}
              <Link to={"/register"} className="text-blue-500 underline">
                Register here
              </Link>
            </p>
            <p className="text-sm text-center border-t border-gray-400 py-4 text-[#333]">
              আপনি যদি লগ ইন করতে কোনো সমস্যার সম্মুখীন হন, দয়া করে LiveChat এর
              মাধ্যমে সহায়তার জন্য আমাদের গ্রাহক পরিষেবার সাথে যোগাযোগ করুন৷
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
