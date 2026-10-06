import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import RightItem from "./RightItem";
import { useSelector } from "react-redux";
import { useToasts } from "react-toast-notifications";
import { useLazyGetUserByIdQuery } from "@/redux/features/allApis/usersApi/usersApi";

const Withdrawal = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { addToast } = useToasts();
  const navigate = useNavigate();

  // State for data
  const [withdrawMethods, setWithdrawMethods] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    userInputs: [],
  });
  const [minWithdraw, setMinWithdraw] = useState(0);

  const { mainColor, backgroundColor } = useSelector(
    (state) => state.themeColor
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // File upload function
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(
      `${import.meta.env.VITE_BASE_API_URL}/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload file");
    }

    const data = await response.json();
    return data.filePath;
  };

  // Fetch withdraw methods and profile
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch withdraw methods
        const methodsResponse = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/withdrawPaymentMethod`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!methodsResponse.ok) {
          const errorData = await methodsResponse.json();
          throw new Error(
            errorData.error || "Failed to fetch payment methods"
          );
        }
        const methodsData = await methodsResponse.json();
        setWithdrawMethods(methodsData);

        // Fetch profile
        if (token) {
          const profileResponse = await fetch(
            `${import.meta.env.VITE_BASE_API_URL}/users/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            throw new Error(errorData.error || "Failed to fetch profile");
          }
          const profileData = await profileResponse.json();
          setProfile(profileData);
        }

        // Fetch withdraw settings
        const settingsResponse = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/withdraws/settings`
        );
        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch withdraw settings"
          );
        }
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.settings) {
          setMinWithdraw(settingsData.settings.minWithdraw);
        }
      } catch (err) {
        setError(err.message);
        addToast(`Error: ${err.message}`, {
          appearance: "error",
          autoDismiss: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Initialize userInputs and reset gateway when method changes
  useEffect(() => {
    if (selectedMethod) {
      setFormData({
        ...formData,
        userInputs: selectedMethod.userInputs.map((input) => ({
          name: input.name,
          value: "",
          label: input.label,
          labelBD: input.labelBD,
          type: input.type,
        })),
      });
      setSelectedGateway(selectedMethod.gateway[0] || ""); // Default to first gateway
    }
  }, [selectedMethod]);

  const [triggerGetUserById, { data: userData, isLoading, isError }] =
    useLazyGetUserByIdQuery();

  const getUserDataAgain = (props) => {
    if (props) {
      triggerGetUserById(props);
    }
  };

  // Handle payment method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  // Handle gateway selection
  const handleGatewayChange = (e) => {
    setSelectedGateway(e.target.value);
  };

  // Handle input changes
  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newUserInputs = [...prev.userInputs];
      newUserInputs[index] = { ...newUserInputs[index], value };
      return { ...prev, userInputs: newUserInputs };
    });
  };

  // Handle file input
  const handleFileInput = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const filePath = await uploadFile(file);
      setFormData((prev) => {
        const newUserInputs = [...prev.userInputs];
        newUserInputs[index] = { ...newUserInputs[index], value: filePath };
        return { ...prev, userInputs: newUserInputs };
      });
    } catch (error) {
      addToast(`Failed to upload file: ${error.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    setFormData({ ...formData, amount: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) {
      addToast("Please select a payment method", {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }
    if (!selectedGateway) {
      addToast("Please select a gateway", {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }
    if (
      !formData.amount ||
      formData.amount < minWithdraw ||
      formData.amount > 30000
    ) {
      addToast(`Amount must be between ৳${minWithdraw} and ৳30,000`, {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }
    if (profile && formData.amount > profile.balance) {
      addToast("Insufficient balance", {
        appearance: "error",
        autoDismiss: true,
      });
      return;
    }
    for (const input of formData.userInputs) {
      if (
        selectedMethod.userInputs.find(
          (i) => i.name === input.name && i.isRequired === "true"
        ) &&
        !input.value
      ) {
        addToast(`Please fill ${input.labelBD || input.label}`, {
          appearance: "error",
          autoDismiss: true,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const transactionData = {
        userId: user._id,
        paymentMethod: {
          methodName: selectedMethod.methodName,
          methodImage: selectedMethod.methodImage,
          gateway: selectedGateway,
        },
        channel: selectedMethod.methodName,
        amount: parseFloat(formData.amount),
        userInputs: formData.userInputs,
        status: "pending",
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/withdrawTransactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit withdrawal");
      }

      const result = await response.json();
      addToast(result.message, { appearance: "success", autoDismiss: true });

      getUserDataAgain(user._id);

      navigate("/");
    } catch (error) {
      addToast(`Failed to submit withdrawal: ${error.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Loading...</div>;
  }

  return (
    <div className="flex gap-4">
      <div className="w-full p-3 sm:p-4 lg:p-6 bg-white rounded-lg space-y-4">
        <h1 className="text-lg font-semibold hidden md:block">উত্তোলন</h1>
        <div className="grid grid-cols-2 bg-gray-700 rounded-t-xl md:hidden">
          <Link to={"/profile/deposit"}>
            <div
              className="w-full p-2  text-center"
              style={{ color: backgroundColor }}
            >
              আমানত
            </div>
          </Link>
          <Link to={"/profile/withdrawal"}>
            <div
              className="w-full p-2  text-center border-b-4"
              style={{ borderColor: mainColor, color: mainColor }}
            >
              উত্তোলন
            </div>
          </Link>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <h2 className="text-base">
            উত্তোলনের বিকল্প <span className="text-red-500">*</span>
          </h2>
          <div className="flex gap-4 flex-wrap">
            {withdrawMethods?.map((method) => (
              <button
                key={method._id}
                onClick={() => handleMethodSelect(method)}
                className={`p-4 w-24 h-16 flex items-center justify-center rounded-2xl border-2 ${
                  selectedMethod?._id === method._id
                    ? "border-yellow-400 bg-slate-200"
                    : "border-gray-300"
                } hover:bg-slate-200 duration-300`}
              >
                <img
                  src={`${import.meta.env.VITE_BASE_API_URL}${
                    method.methodImage
                  }`}
                  alt={method.methodNameBD}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Input Fields, Gateway, Amount, and Submit */}
        {selectedMethod && (
          <div className="space-y-4">
            {/* Gateway Selection */}
            <div className="space-y-2 w-full md:w-80">
              <label className="text-base">
                গেটওয়ে <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedGateway}
                onChange={handleGatewayChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="">গেটওয়ে সিলেক্ট করুন</option>
                {selectedMethod.gateway.map((gateway, index) => (
                  <option key={index} value={gateway}>
                    {gateway}
                  </option>
                ))}
              </select>
            </div>
            {/* Dynamic Input Fields */}
            {selectedMethod.userInputs.map((input, index) => (
              <div key={input.name} className="space-y-2 w-full md:w-80">
                <label className="text-base">
                  {input.labelBD || input.label}{" "}
                  {input.isRequired === "true" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                {input.type === "file" ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileInput(e, index)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                ) : (
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData.userInputs[index]?.value || ""}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder={
                      input.fieldInstructionBD || input.fieldInstruction || ""
                    }
                  />
                )}
              </div>
            ))}
            {/* Amount Input */}
            <div className="space-y-2 w-full md:w-80">
              <div className="flex items-center gap-2 justify-between">
                <h2 className="text-base">
                  উত্তোলনযোগ্য পরিমাণ <span className="text-red-500">*</span>
                </h2>
                <FaQuestionCircle />
              </div>
              <input
                type="number"
                value={formData.amount}
                onChange={handleAmountChange}
                className="w-full py-1.5 px-4 border-2 border-gray-300 outline-none rounded-md"
                placeholder={`ন্যূনতম ৳${minWithdraw}.00 - সর্বোচ্চ ৳30,000.00 (ব্যালেন্স: ৳${
                  profile?.balance?.toFixed(2) || "0.00"
                })`}
                min={minWithdraw}
                max="30000"
              />
            </div>
            {/* Submit Button */}
            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                disabled={submitting}
                className={`py-3 px-10 w-full sm:w-80 text-sm text-white bg-blue-500 hover:bg-blue-600 duration-300 rounded-full border ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "Submitting..." : "উত্তোলন"}
              </button>
            </form>
          </div>
        )}
      </div>
      <RightItem />
    </div>
  );
};

export default Withdrawal;