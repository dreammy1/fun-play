import { useAddUserMutation } from "@/redux/features/allApis/usersApi/usersApi";
import React from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import registerImage from "../../assets/registerPage.png";

const Registration = () => {
  const { mainColor, backgroundColor } = useSelector(
    (state) => state.themeColor
  );

  const [addUser, { isLoading }] = useAddUserMutation();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const { addToast } = useToasts();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refer = params.get("refer");
    if (refer) {
      setValue("referralCode", refer);
    }
  }, [location, setValue]);

  const onSubmit = async (data) => {
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, verificationCode, ...userInfo } = data;
    const result = await addUser(userInfo);
    if (result.error) {
      // console.log(result.error.data.data.error);

      addToast(
        result.error.data.message ||
          "এই নাম্বার অথবা  ইউজার নেম  একাউন্ট রয়েছে ভিন্ন নাম্বার ইউজার নেম ব্যাবহার করুন !!",
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
      reloadVerificationCode();
    }
    if (result.data.insertedId) {
      addToast("একাউন্ট তৈরি হয়েছে", {
        appearance: "success",
        autoDismiss: true,
      });
      reset();
      reloadVerificationCode();
      navigate("/login");
    }
  };

  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const [verificationCode, setVerificationCode] = React.useState(
    generateVerificationCode()
  );

  const reloadVerificationCode = () => {
    setVerificationCode(generateVerificationCode());
  };

  // Watch the password and confirmPassword fields
  const password = watch("password");
  // eslint-disable-next-line no-unused-vars
  const confirmPassword = watch("confirmPassword");

  // Custom validation for confirmPassword
  const validateConfirmPassword = (value) => {
    return value === password || "পাসওয়ার্ড মেলে না";
  };

  // Custom validation for verificationCode
  const validateVerificationCode = (value) => {
    return value === verificationCode || "ভেরিফিকেশন কোড মেলে না";
  };

  // Custom validation for username (no spaces)
  const validateUsername = (value) => {
    return !/\s/.test(value) || "ব্যবহারকারীর নামে স্পেস থাকতে পারবে না";
  };

  // Custom validation for password (must contain letters and numbers)
  const validatePassword = (value) => {
    const hasLetters = /[a-zA-Z]/.test(value);
    const hasNumbers = /[0-9]/.test(value);
    return (
      (hasLetters && hasNumbers) || "পাসওয়ার্ডে অক্ষর এবং সংখ্যা থাকতে হবে"
    );
  };

  return (
    <div>
      <div className="bg-[#ebebeb]">
        <h2 className="text-2xl text-center font-semibold pt-10 text-[#333]">
          একাউন্ট তৈরি করুন
        </h2>
        <p className="px-2 text-sm text-center lg:text-base text-[#333]">
          আসুন আপনাকে No.1 ক্রিকেট এক্সচেঞ্জ এবং বেটিং প্ল্যাটফর্মে নিবন্ধন
          করিয়ে দিই
        </p>
        <div className="max-w-[500px] mx-auto py-6 pb-16">
          <img src={registerImage} alt="" />
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[#ebebeb] sm:bg-white p-8 sm:p-10 md:px-20 md:py-10"
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
                {...register("username", {
                  required: "এই ঘরটি পূরণ করা আবশ্যক",
                  validate: validateUsername,
                })}
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="এখানে পূরণ করুন"
              />
              {errors.username && (
                <span className="text-red-600 text-sm">
                  {errors.username.message}
                </span>
              )}
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
                {...register("password", {
                  required: "এই ঘরটি পূরণ করা আবশ্যক",
                  validate: validatePassword,
                })}
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="এখানে পাসওয়ার্ড পূরণ করুন"
              />
              {errors.password && (
                <span className="text-red-600 text-sm">
                  {errors.password.message}
                </span>
              )}
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register("confirmPassword", {
                  required: "এই ঘরটি পূরণ করা আবশ্যক",
                  validate: validateConfirmPassword,
                })}
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="পাসওয়ার্ড নিশ্চিত করুন"
              />
              {errors.confirmPassword && (
                <span className="text-red-600 text-sm">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
            <div className="mb-6">
              <label
                htmlFor="number"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                মোবাইল নম্বর <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="number"
                {...register("number", { required: "এই ঘরটি পূরণ করা আবশ্যক" })}
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="এখানে পূরণ করুন"
              />
              {errors.number && (
                <span className="text-red-600 text-sm">
                  {errors.number.message}
                </span>
              )}
            </div>
            <div className="mb-6">
              <label
                htmlFor="verificationCode"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                ভেরিফিকেশন কোড <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center">
                <div className="relative w-full">
                  <input
                    type="text"
                    id="verificationCode"
                    {...register("verificationCode", {
                      required: "এই ঘরটি পূরণ করা আবশ্যক",
                      validate: validateVerificationCode,
                    })}
                    className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                    placeholder="ভেরিফিকেশন কোড লিখুন"
                  />
                  <p className="text-white absolute top-1/2 transform -translate-y-1/2 right-0 bg-black px-1 py-0.5">
                    {verificationCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reloadVerificationCode}
                  className="ml-2 p-2 rounded-lg transition-all duration-500"
                  style={{ backgroundColor: mainColor, color: backgroundColor }}
                >
                  রিলোড
                </button>
              </div>
              {errors.verificationCode && (
                <span className="text-red-600 text-sm">
                  {errors.verificationCode.message}
                </span>
              )}
            </div>
            <div className="mb-6">
              <label
                htmlFor="referralCode"
                className="block mb-2 text-base font-medium text-gray-900 dark:text-white"
              >
                রেফারেল কোড
              </label>
              <input
                type="text"
                id="referralCode"
                {...register("referralCode")}
                className="bg-gray-50 border border-gray-600 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-[#FFCD03]"
                placeholder="রেফারেল কোড লিখুন"
              />
            </div>
            <button
              disabled={isLoading}
              type="submit"
              className="text-base text-black bg-[#FFCD03] hover:bg-[#e5be22] transition-all duration-500 focus:outline-none font-medium rounded-lg w-full px-5 py-2.5 text-center"
              style={{ backgroundColor: backgroundColor, color: mainColor }}
            >
              {isLoading ? "অপেক্ষা করুন..." : "নিবন্ধন"}
            </button>

            <div className="flex items-center mt-4">
              <div className="flex items-center h-5">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-black dark:ring-offset-gray-800"
                />
              </div>
              <label
                htmlFor="remember"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                রেজিস্টার বোতামে ক্লিক করে, আমি এতদ্বারা স্বীকার করছি যে আমার
                বয়স ১৮ বছরের বেশি এবং আমি আপনার শর্তাবলী পড়েছি এবং মেনে
                নিয়েছি।
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
