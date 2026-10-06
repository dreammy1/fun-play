import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Smartphone, 
  Hash, 
  Calendar, 
  RotateCcw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale"; // For Bengali date formatting

const OpayApi = () => {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [runningUpdating, setRunningUpdating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  // Load saved settings and auto-refresh validation using saved key
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/opay/settings`);
        const data = await res.json();
        if (res.ok) {
          if (data?.apiKey) setApiKey(data.apiKey);
          if (data?.validation) setResult(data.validation);
          setRunning(!!data?.running);
        }
      } catch (err) {
        console.warn("Failed to load Opay settings", err?.message || err);
      } finally {
        setInitializing(false);
      }
    };
    load();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!result?.endDate) {
      setCountdown(null);
      return;
    }
    const target = new Date(result.endDate).getTime();
    const tick = () => {
      const now = Date.now();
      let diff = target - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds, expired: diff === 0 });
      setIsExpiringSoon(days <= 10 && days > 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [result?.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/opay/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.reason || "Validation failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-3">
            Opay API Validation
          </h1>
          <p className="text-gray-400 text-lg">আপনার Opay API Key দিয়ে সাবস্ক্রিপশন ভ্যালিড কিনা চেক করুন</p>
        </motion.div>

        {/* Form Section */}
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/20 shadow-xl mb-8"
        >
          {/* Running Switch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <ToggleLeft className="w-6 h-6 text-cyan-400" />
              <span className="font-semibold">Integration Running</span>
            </div>
            <div className="flex items-center gap-4">
              <RunningSwitch
                checked={running}
                onChange={async (next) => {
                  setRunningUpdating(true);
                  try {
                    const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/opay/running`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ running: next }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setRunning(data.running);
                    } else {
                      alert(data?.reason || "Failed to update running state");
                    }
                  } catch (e) {
                    alert(e.message || "Network error");
                  } finally {
                    setRunningUpdating(false);
                  }
                }}
                disabled={runningUpdating || loading}
              />
              <span className="text-sm text-gray-400">
                {runningUpdating ? "Updating..." : running ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
              placeholder="Enter your Opay API Key"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || initializing}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                Validating...
              </>
            ) : "Validate Key"}
          </button>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/40 backdrop-blur-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Validation Failed</p>
                <p className="text-sm text-red-200">{String(error)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initializing Loader */}
        {initializing && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 text-gray-400">
              <RotateCcw className="w-6 h-6 animate-spin" />
              <span>Loading saved settings...</span>
            </div>
          </div>
        )}

        {/* Countdown Banner */}
        <AnimatePresence>
          {result && countdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <CountdownBanner countdown={countdown} isExpiringSoon={isExpiringSoon} expired={countdown.expired} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Grid */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <StatusCard 
                icon={<CheckCircle className="w-5 h-5" />}
                title="Valid" 
                value={result.valid ? "Yes" : "No"} 
                status={result.valid ? "green" : "red"} 
              />
              <StatusCard 
                icon={<Hash className="w-5 h-5" />}
                title="Plan" 
                value={result?.plan?.name || "N/A"} 
                status="blue" 
              />
              <StatusCard 
                icon={<Globe className="w-5 h-5" />}
                title="Primary Domain" 
                value={result?.primaryDomain || "N/A"} 
                status="purple" 
              />
              <StatusCard 
                icon={<Globe className="w-5 h-5" />}
                title="Domains" 
                value={Array.isArray(result?.domains) ? result.domains.join(", ") : "N/A"} 
                status="purple" 
              />
              <StatusCard 
                icon={<Smartphone className="w-5 h-5" />}
                title="Device Count" 
                value={String(result?.deviceCount ?? "0")} 
                status="cyan" 
              />
              <StatusCard 
                icon={<Smartphone className="w-5 h-5" />}
                title="Active Number Count" 
                value={String(result?.activeNumberCount ?? "0")} 
                status="cyan" 
              />
              <StatusCard 
                icon={<Calendar className="w-5 h-5" />}
                title="End Date" 
                value={result?.endDate ? new Date(result.endDate).toLocaleDateString("bn-BD", { dateStyle: "full" }) : "N/A"} 
                status="yellow" 
              />
              <StatusCard 
                icon={<Calendar className="w-5 h-5" />}
                title="Latest End Date" 
                value={result?.latestEndDate ? new Date(result.latestEndDate).toLocaleDateString("bn-BD", { dateStyle: "full" }) : "N/A"} 
                status="yellow" 
              />
              <StatusCard 
                icon={<Clock className="w-5 h-5" />}
                title="Days to Expire" 
                value={computeDaysLeft(result?.endDate)} 
                status={isExpiringSoon ? "red" : "green"} 
              />
              <StatusCard 
                icon={<Hash className="w-5 h-5" />}
                title="Subscription ID" 
                value={result?.subscriptionId || "N/A"} 
                status="blue" 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const computeDaysLeft = (dateStr) => {
  if (!dateStr) return "N/A";
  const now = new Date();
  const end = new Date(dateStr);
  const diffMs = end - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? `${days} days left` : `Expired ${Math.abs(days)} days ago`;
};

const StatusCard = ({ icon, title, value, status }) => {
  const colorMap = {
    green: "bg-green-500/10 border-green-500/40 text-green-400",
    red: "bg-red-500/10 border-red-500/40 text-red-400",
    blue: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/40 text-purple-400",
    cyan: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400",
    yellow: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400",
  };
  const cls = colorMap[status] || colorMap.blue;

  return (
    <div className={`rounded-2xl p-5 backdrop-blur-md ${cls} flex items-start gap-4`}>
      <div className="p-3 rounded-xl bg-white/5">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-lg font-semibold break-all">{value}</p>
      </div>
    </div>
  );
};

// Enhanced Switch
const RunningSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-7 w-14 rounded-full transition-colors focus:outline-none ${
      checked ? "bg-green-500" : "bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <span
      className={`absolute inset-y-0 left-0 flex items-center justify-center w-7 h-7 transform transition-transform ${
        checked ? "translate-x-7" : "translate-x-0"
      }`}
    >
      {checked ? (
        <CheckCircle className="w-4 h-4 text-white" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400" />
      )}
    </span>
  </button>
);

// Enhanced Countdown Banner
const CountdownBanner = ({ countdown, isExpiringSoon, expired }) => {
  const { days, hours, minutes, seconds } = countdown;
  const baseCls = "rounded-2xl p-6 md:p-8 backdrop-blur-md border text-center";
  const stateCls = expired
    ? "bg-red-600/20 border-red-500/40 text-red-200"
    : isExpiringSoon
    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200 animate-pulse"
    : "bg-green-500/20 border-green-500/40 text-green-200";

  return (
    <div className={`${baseCls} ${stateCls}`}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-3">
        {expired ? <AlertCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
        {expired ? "Subscription Expired" : "Subscription Ends In"}
      </h2>
      {!expired && (
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-4xl md:text-5xl font-mono font-extrabold">
          <TimeBlock label="Days" value={days} highlight={isExpiringSoon} />
          <Separator />
          <TimeBlock label="Hours" value={hours} />
          <Separator />
          <TimeBlock label="Minutes" value={minutes} />
          <Separator />
          <TimeBlock label="Seconds" value={seconds} />
        </div>
      )}
      {isExpiringSoon && !expired && (
        <p className="mt-4 text-lg font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          শেষ ১০ দিনের মধ্যে - দ্রুত নবায়ন করুন!
        </p>
      )}
      {expired && (
        <p className="mt-4 text-lg font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          দয়া করে সাবস্ক্রিপশন রিনিউ করুন
        </p>
      )}
    </div>
  );
};

const TimeBlock = ({ label, value, highlight }) => (
  <div className="flex flex-col items-center min-w-[80px]">
    <span
      className={`px-4 py-2 rounded-xl shadow-lg ${
        highlight ? "bg-red-500/50 text-white" : "bg-white/10 text-white"
      }`}
    >
      {String(value).padStart(2, "0")}
    </span>
    <span className="mt-2 text-sm uppercase text-gray-300">{label}</span>
  </div>
);

const Separator = () => <span className="text-4xl md:text-5xl text-gray-400/50">:</span>;

export default OpayApi;