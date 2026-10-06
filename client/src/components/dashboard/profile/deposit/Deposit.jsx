import { FaQuestionCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import RightItem from "./RightItem";
import axios from "axios";
import { useSelector } from "react-redux";
import { useToasts } from "react-toast-notifications";
import { io } from "socket.io-client";

const Deposit = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [amount, setAmount] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [timer, setTimer] = useState(1200);
  const [userInputs, setUserInputs] = useState({});
  const [loading, setLoading] = useState(false); // New loading state
  const { addToast } = useToasts();
  // Opay integration states
  const [opaySettings, setOpaySettings] = useState(null);
  const [devices, setDevices] = useState([]);
  const socketRef = useRef(null);
  // Determine availability using either validation.valid or validation.success and any active/online device
  const opayAvailable = (() => {
    if (!opaySettings) return false;
    const running = opaySettings.running === true;
    const apiKeyOk = !!opaySettings.apiKey;
    const validationObj = opaySettings.validation || {};
    const validationOk =
      (validationObj.valid === true || validationObj.success !== false) &&
      validationObj.reason !== "DOMAIN_MISMATCH";
    const onlineCount = devices.filter(
      (d) => d.active === true || d.status === "online"
    ).length;
    return running && apiKeyOk && validationOk && onlineCount > 0;
  })();

  const { mainColor, backgroundColor } = useSelector((state) => state.themeColor);
  const { user } = useSelector((state) => state.auth);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const paymentMethodsRes = await axios.get(
          `${import.meta.env.VITE_BASE_API_URL}/depositPaymentMethod/deposit-methods`
        );
        setPaymentMethods(paymentMethodsRes.data.data);

        const promotionsRes = await axios.get(
          `${import.meta.env.VITE_BASE_API_URL}/depositPromotions/deposit-promotions`
        );
        setPromotions(promotionsRes.data.data);
        try {
          const opayRes = await axios.get(`${import.meta.env.VITE_BASE_API_URL}/opay/settings`);
          setOpaySettings(opayRes.data);
        } catch {
          // ignore opay error
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Presence socket: listen for device updates when apiKey exists
  useEffect(() => {
    if (!opaySettings?.apiKey) return;
    const url = import.meta.env.VITE_PRESENCE_SOCKET_URL;
    if (!url) return;
    socketRef.current = io(url, { transports: ["websocket"], reconnection: true });
    socketRef.current.on("connect", () => {
      socketRef.current.emit("viewer:registerApiKey", { apiKey: opaySettings.apiKey });
    });
    socketRef.current.on("viewer:devices", (list) => {
      if (Array.isArray(list))
        setDevices(
          list.map((d) => ({
            ...d,
            // Normalize possible status property
            active: d.active === true || d.status === "online",
          }))
        );
    });
    socketRef.current.on("viewer:device", (dev) => {
      if (!dev?.deviceId) return;
      const normalized = {
        ...dev,
        active: dev.active === true || dev.status === "online",
      };
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === normalized.deviceId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...normalized };
          return copy;
        }
        return [...prev, normalized];
      });
    });
    return () => {
      socketRef.current && socketRef.current.disconnect();
    };
  }, [opaySettings?.apiKey]);

  // Countdown timer effect
  useEffect(() => {
    if (modalIsOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [modalIsOpen, timer]);

  // Format timer as MM:SS
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePromotionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setSelectedChannel(null);
    setUserInputs({});
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || !isNaN(value)) {
      setAmount(value);
    }
  };

  const handleQuickAmountSelect = (value) => {
    setAmount(value);
  };

  const handleInputChange = (name, value) => {
    setUserInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    setUserInputs((prev) => ({ ...prev, [name]: file }));
  };

  // Helpers for Opay token generation (moved above openModal for reuse)
  const computeFinalAmount = () => {
    const base = parseFloat(amount) || 0;
    if (!selectedOption) return base;
    const promo = promotions.find((p) => p.title_bd === selectedOption);
    if (!promo) return base;
    const pmBonus = promo.promotion_bonuses?.find(
      (b) => b.payment_method._id.toString() === selectedPaymentMethod?._id.toString()
    );
    if (!pmBonus) return base;
    if (pmBonus.bonus_type === "Fix") return base + Number(pmBonus.bonus || 0);
    const percent = Number(pmBonus.bonus || 0);
    return Math.round((base + base * (percent / 100)) * 100) / 100;
  };

  const normalizeMethodNameForOpay = () => {
    const raw = (selectedPaymentMethod?.methodNameEN || selectedPaymentMethod?.methodNameBD || "").toLowerCase();
    if (raw.includes("bkash")) return "Bkash";
    if (raw.includes("nagad")) return "Nagad";
    if (raw.includes("rocket")) return "Rocket";
    if (raw.includes("upay")) return "Upay";
    return "Bkash";
  };

  // If Opay is unavailable, fetch support number and inform user
  const fetchSupportNumberAndNotify = async () => {
    try {
      const res = await axios.get(
        "https://api.oraclepay.org/api/external/support-number",
        {
          timeout: 10000,
          headers: { "X-API-Key": opaySettings?.apiKey || "" },
        }
      );
      const num = res?.data?.supportNumber || res?.data?.number || res?.data?.phone;
      if (num) {
        addToast(`Opay unavailable. Please contact support: ${num}`, {
          appearance: "error",
          autoDismiss: true,
        });
      } else {
        addToast("Opay unavailable. Please contact support team.", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    } catch {
      addToast("Opay unavailable. Please contact support team.", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const openModal = () => {
    if (
      selectedPaymentMethod &&
      selectedChannel &&
      amount &&
      parseFloat(amount) >= 200
    ) {
      // If Opay is selected, generate link and open in new tab instead of opening modal
      if (selectedChannel === "Opay") {
        if (!opayAvailable) {
          fetchSupportNumberAndNotify();
          return;
        }
        (async () => {
          try {
            setLoading(true);
            const finalAmount = computeFinalAmount();
            const methodParam = normalizeMethodNameForOpay();
            const genUrl = `${import.meta.env.VITE_PRESENCE_SOCKET_URL}/api/external/generate?methods=${encodeURIComponent(methodParam)}&amount=${encodeURIComponent(finalAmount)}&userIdentifyAddress=${encodeURIComponent(user?.username || "unknown")}`;
            const genRes = await axios.get(genUrl, {
              timeout: 15000,
              headers: { "X-API-Key": opaySettings?.apiKey || "" },
            });
            if (!genRes.data || genRes.data.success === false) {
              addToast("Opay generate ব্যর্থ হয়েছে", { appearance: "error", autoDismiss: true });
              return;
            }
            const payUrl = genRes.data.payment_page_url;
            if (payUrl) {
              window.open(payUrl, "_blank", "noopener,noreferrer");
              addToast("Payment page opened in new tab", { appearance: "success", autoDismiss: true });
            } else {
              addToast("Payment page URL not received", { appearance: "warning", autoDismiss: true });
            }
          } catch (err) {
            addToast(`Opay generate error: ${err.message}`, { appearance: "error", autoDismiss: true });
          } finally {
            setLoading(false);
          }
        })();
        return; // Do not open modal for Opay
      }
      setModalIsOpen(true);
      setTimer(1200);
    } else {
      alert(
        "Please select a payment method, channel, and enter an amount of at least 200."
      );
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setTimer(1200);
    setUserInputs({});
  };


  const handleSubmit = async () => {
    setLoading(true); // Set loading to true when submission starts
    try {
      // Step 1: Validate required inputs
      const requiredInputs = selectedPaymentMethod.userInputs.filter(
        (input) => input.isRequired === "true"
      );
      const missingInputs = requiredInputs.filter(
        (input) =>
          !userInputs[input.name] ||
          userInputs[input.name].toString().trim() === ""
      );

      if (missingInputs.length > 0) {
        const missingFields = missingInputs
          .map((input) => input.labelBD)
          .join(", ");
        addToast(`Please fill in all required fields: ${missingFields}`, {
          appearance: "error",
          autoDismiss: true,
        });
        return;
      }

      // Step 2: Prepare userInputs
      const updatedUserInputs = { ...userInputs };
      for (const [name, value] of Object.entries(userInputs)) {
        const inputConfig = selectedPaymentMethod.userInputs.find(
          (input) => input.name === name
        );
        if (!inputConfig) continue;

        if (value instanceof File) {
          // Handle file upload
          const fileFormData = new FormData();
          fileFormData.append("image", value);
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_BASE_API_URL}/upload`,
            {
              method: "POST",
              body: fileFormData,
            }
          );
          const uploadResult = await uploadResponse.json();
          if (!uploadResponse.ok) {
            throw new Error(uploadResult.error || "Failed to upload file");
          }
          updatedUserInputs[name] = {
            level: "user",
            type: inputConfig.type,
            data: uploadResult.filePath,
          };
        } else {
          // Handle text/number inputs
          updatedUserInputs[name] = {
            level: inputConfig.labelBD.toLowerCase().replace(/\s+/g, "_"),
            type: inputConfig.type,
            data: value,
          };
        }
      }

      // Opay payment page handling when Opay channel selected
      if (selectedChannel === "Opay") {
        if (!opayAvailable) {
          await fetchSupportNumberAndNotify();
          setLoading(false);
          return;
        }
        try {
          const finalAmount = computeFinalAmount();
          const methodParam = normalizeMethodNameForOpay();
          const genUrl = `${import.meta.env.VITE_PRESENCE_SOCKET_URL}/api/external/generate?methods=${encodeURIComponent(methodParam)}&amount=${encodeURIComponent(finalAmount)}&userIdentifyAddress=${encodeURIComponent(user?.username || "unknown")}`;
          const genRes = await axios.get(genUrl, {
            timeout: 15000,
            headers: {
              "X-API-Key": opaySettings?.apiKey || "",
            },
          });
          if (!genRes.data || genRes.data.success === false) {
            addToast("Opay token generate ব্যর্থ হয়েছে", { appearance: "error", autoDismiss: true });
            setLoading(false);
            return;
          }
          const payUrl = genRes.data.payment_page_url;
          if (payUrl) {
            window.open(payUrl, "_blank", "noopener,noreferrer");
            addToast("Payment page opened in new tab", { appearance: "success", autoDismiss: true });
          } else {
            addToast("Payment page URL not received", { appearance: "warning", autoDismiss: true });
          }
        } catch (err) {
          addToast(`Opay generate error: ${err.message}`, { appearance: "error", autoDismiss: true });
          setLoading(false);
          return;
        }
      }

      // Step 3: Create FormData for transaction
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/depositTransactions/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?._id,
            paymentMethodId: selectedPaymentMethod._id,
            amount,
            promotionId: selectedOption
              ? promotions.find((promo) => promo.title_bd === selectedOption)?._id
              : null,
            userInputs: updatedUserInputs,
            gateways: selectedChannel,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        addToast(
          `Failed to create deposit transaction: ${
            result.error || "Unknown error"
          }`,
          {
            appearance: "error",
            autoDismiss: true,
          }
        );
      } else {
        addToast("Deposit transaction created successfully!", {
          appearance: "success",
          autoDismiss: true,
        });
        closeModal();
      }
    } catch (error) {
      console.error("Error creating deposit transaction:", error);
      addToast(`Failed to create deposit transaction: ${error.message}`, {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setLoading(false); // Reset loading state when submission is complete
    }
  };

  // Get bonus label for a payment method based on selected promotion
  const getBonusLabel = (methodId) => {
    if (!selectedOption) return null;
    const selectedPromo = promotions.find(
      (promo) => promo.title_bd === selectedOption
    );
    if (!selectedPromo) return null;

    const bonus = selectedPromo.promotion_bonuses.find(
      (b) => b.payment_method._id.toString() === methodId.toString()
    );
    if (!bonus) return null;

    return bonus.bonus_type === "Fix"
      ? `+${bonus.bonus}TK`
      : `+${bonus.bonus}%`;
  };

  // Filter payment methods based on selected promotion
  const filteredPaymentMethods = selectedOption
    ? paymentMethods.filter((method) => {
        const selectedPromo = promotions.find(
          (promo) => promo.title_bd === selectedOption
        );
        return selectedPromo?.promotion_bonuses.some(
          (bonus) =>
            bonus.payment_method._id.toString() === method._id.toString()
        );
      })
    : paymentMethods;

  // Gateways with Opay always visible; availability handled on click
  let gateways = selectedPaymentMethod ? [...(selectedPaymentMethod.gateway || [])] : [];
  if (selectedPaymentMethod && !gateways.includes("Opay")) {
    gateways.push("Opay");
  }

  // Check if the deposit button should be enabled
  const isDepositButtonEnabled =
    selectedPaymentMethod &&
    selectedChannel &&
    amount &&
    parseFloat(amount) >= 200;

  return (
    <div className="flex gap-4">
      <div className="w-full p-3 sm:p-4 lg:p-6 bg-white rounded-lg space-y-4">
        <h1 className="text-lg font-semibold hidden md:block">আমানত</h1>
        <div className="grid grid-cols-2 bg-gray-700 rounded-t-xl md:hidden">
          <Link to={"/profile/deposit"}>
            <div
              className="w-full p-2 text-center border-b-4"
              style={{ borderColor: mainColor, color: mainColor }}
            >
              আমানত
            </div>
          </Link>
          <Link to={"/profile/withdrawal"}>
            <div
              className="w-full p-2 text-center"
              style={{ color: backgroundColor }}
            >
              উত্তোলন
            </div>
          </Link>
        </div>

        <div className="space-y-2">
          <h2 className="text-base">
            আমানত বিকল্প <span className="text-red-500">*</span>
          </h2>
          <div className="flex gap-4">
            {filteredPaymentMethods.map((method) => (
              <button
                key={method._id}
                onClick={() => handlePaymentMethodSelect(method)}
                className="relative"
              >
                <div
                  className={`p-4 w-full sm:w-24 h-16 flex items-center justify-center hover:bg-slate-200 duration-300 rounded-2xl border-2 ${
                    selectedPaymentMethod?._id === method._id
                      ? "border-yellow-400"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={`${import.meta.env.VITE_BASE_API_URL}${
                      method.methodImage
                    }`}
                    alt={method.methodNameBD}
                    className="w-full h-auto"
                    style={{ objectFit: "contain", width: "60px" }}
                  />
                </div>
                {getBonusLabel(method._id) && (
                  <div className="p-1 absolute -top-1 -right-1 flex justify-center items-center text-[9px] text-white bg-blue-500 rounded-full">
                    {getBonusLabel(method._id)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-base">
            আমানত চ্যানেল <span className="text-red-500">*</span>
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-4">
          
            {gateways.map((gateway, index) => (
              <button
                key={index}
                onClick={() => handleChannelSelect(gateway)}
                className={
                  selectedPaymentMethod ? "" : "pointer-events-none opacity-50"
                }
              >
                <div
                  className={`py-1.5 px-4 flex items-center justify-center hover:bg-slate-200 duration-300 rounded-lg border-2 ${
                    selectedChannel === gateway
                      ? "border-yellow-400"
                      : "border-gray-400"
                  }`}
                >
                  {gateway}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-between w-full sm:w-80">
            <h2 className="text-base">
              আমানত পরিমাণ <span className="text-red-500">*</span>
            </h2>
            <FaQuestionCircle />
          </div>
          <form>
            <input
              type="text"
              className="w-full sm:w-80 py-1.5 px-4 border-2 border-gray-300 outline-none rounded-xl"
              placeholder="200"
              value={amount}
              onChange={handleAmountChange}
              disabled={!selectedChannel}
            />
          </form>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {["200", "500", "2000", "5000", "10000", "20000"].map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmountSelect(value)}
                className={
                  selectedChannel ? "" : "pointer-events-none opacity-50"
                }
              >
                <div
                  className={`py-1.5 px-4 flex items-center justify-center hover:bg-slate-200 duration-300 rounded-lg ${
                    amount === value
                      ? "border-2 border-yellow-400"
                      : "bg-gray-200"
                  }`}
                >
                  {value}
                </div>
              </button>
            ))}
          </div>
          <h2 className="text-base">
            আমানত বোনাস <span className="text-red-500">*</span>
          </h2>
          <div className="space-y-4 w-full sm:w-80">
            <select
              id="options"
              value={selectedOption}
              onChange={handlePromotionChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">নো বোনাস সিলেক্ট করুন</option>
              {promotions.map((promo) => (
                <option key={promo._id} value={promo.title_bd}>
                  {promo.title_bd}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={openModal}
            className={`py-3 px-10 w-full sm:w-80 text-sm text-white rounded-full border duration-300 ${
              isDepositButtonEnabled && !loading
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isDepositButtonEnabled || loading}
          >
            আমানত
          </button>
        </div>
      </div>
      <RightItem />

      {/* Modal */}
      {modalIsOpen && selectedPaymentMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
          <div
            className="p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] md:w-[85%] lg:w-[70%] max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100 hover:scale-100"
            style={{ backgroundColor: selectedPaymentMethod.backgroundColor }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side: Agent Info and User Inputs */}
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="border-b-2 border-gray-200 pb-4">
                  <p className="text-xl md:text-2xl font-semibold text-gray-800">
                    {selectedPaymentMethod.agentWalletText}
                  </p>
                  <p className="text-3xl md:text-4xl text-red-500 font-bold mt-2">
                    {selectedPaymentMethod.agentWalletNumber}
                  </p>
                </div>
                <p className="text-lg md:text-xl">
                  Amount:{" "}
                  <span className="text-red-500 font-bold">
                    {amount || "2000.00"}
                  </span>
                </p>
                <div className="space-y-4">
                  {selectedPaymentMethod.userInputs.map((input, index) => (
                    <div key={index} className="flex flex-col">
                      <label
                        htmlFor={input.name}
                        className="text-lg text-red-500 font-medium mb-2"
                      >
                        {input.labelBD}{" "}
                        {input.isRequired === "true" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      {input.type === "file" ? (
                        <input
                          type="file"
                          id={input.name}
                          className="w-full py-2 px-3 bg-white rounded-lg border border-gray-300 text-gray-700"
                          onChange={(e) =>
                            handleFileChange(input.name, e.target.files[0])
                          }
                        />
                      ) : (
                        <input
                          type={input.type}
                          id={input.name}
                          name={input.name}
                          className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                          placeholder={input.fieldInstructionBD}
                          required={input.isRequired === "true"}
                          value={userInputs[input.name] || ""}
                          onChange={(e) =>
                            handleInputChange(input.name, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-full sm:w-64 mt-6">
                  <button
                    onClick={handleSubmit}
                    className={`w-full py-3 text-lg font-semibold rounded-lg shadow-md hover:brightness-110 transition-all duration-200 flex items-center justify-center ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      backgroundColor: selectedPaymentMethod.buttonColor,
                      color: selectedPaymentMethod.color,
                    }}
                    disabled={loading} // Disable button when loading
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    ) : (
                      "Submit"
                    )}
                    {loading && "Submitting..."}
                  </button>
                </div>
              </div>

              {/* Right Side: Timer and Payment Page Image */}
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="text-center bg-gray-100 rounded-lg py-4 shadow-inner">
                  <p className="text-xl md:text-2xl font-semibold text-gray-800">
                    Time Remaining
                  </p>
                  <p className="text-4xl md:text-5xl text-red-500 font-bold mt-2">
                    {formatTimer(timer)}
                  </p>
                </div>
                <img
                  className="w-full h-48 md:h-64 object-contain rounded-lg"
                  src={`${import.meta.env.VITE_BASE_API_URL}${
                    selectedPaymentMethod.paymentPageImage
                  }`}
                  alt={selectedPaymentMethod.methodNameBD}
                />
              </div>
            </div>

            <div className="mt-6 text-base md:text-lg text-gray-600 text-center">
              <p>
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedPaymentMethod?.instructionBD,
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposit;