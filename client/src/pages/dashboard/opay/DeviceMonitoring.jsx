import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Activity, Shield, Key, Zap, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DeviceMonitoring = () => {
  const [apiKey, setApiKey] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [running, setRunning] = useState(false);
  const [valid, setValid] = useState(false);
  const [devices, setDevices] = useState([]);
  const socketRef = useRef(null);

  // ... (same useEffect logic as before - unchanged)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/opay/settings`);
        const data = await res.json();
        if (res.ok) {
          setApiKey(data?.apiKey || "");
          setRunning(!!data?.running);
          setValid(!!data?.validation?.valid);
        }
      } catch (e) {
        console.warn("Failed to load settings", e);
      } finally {
        setInitializing(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const canConnect = apiKey && valid && running;
    if (!canConnect) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    if (socketRef.current) return;

    const SOCKET_URL = import.meta.env.VITE_PRESENCE_SOCKET_URL || import.meta.env.VITE_BASE_API_URL;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("viewer:registerApiKey", { apiKey }));
    socket.on("viewer:devices", (list) => Array.isArray(list) && setDevices(list));
    socket.on("viewer:device", (d) => {
      if (!d?.deviceId) return;
      setDevices(prev => {
        const idx = prev.findIndex(x => x.deviceId === d.deviceId);
        if (idx === -1) return [...prev, d];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...d };
        return copy;
      });
    });

    return () => socket.disconnect();
  }, [apiKey, valid, running]);

  // Always show active devices first
  const sortedDevices = [...devices].sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
  const onlineCount = devices.filter(d => d.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            Device Monitoring
          </h1>
          <p className="mt-3 text-gray-400 text-sm sm:text-base">Real-time presence dashboard</p>
        </motion.div>

        {/* Top Status Bar - Super Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatusBox icon={<Zap />} label="Integration" active={running} />
          <StatusBox icon={<Key />} label="API Key" active={!!apiKey} />
          <StatusBox icon={<Shield />} label="Validation" active={valid} />
          <StatusBox icon={<Activity />} label="Online" value={`${onlineCount}/${devices.length}`} active={onlineCount > 0} glow />
        </div>

        {/* Warning */}
        {!(apiKey && valid && running) && (
          <div className="mb-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 backdrop-blur">
            <p className="text-yellow-300 text-sm text-center">
              Integration is not fully active. Check Opay settings.
            </p>
          </div>
        )}

        {/* Devices Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Wifi className="w-7 h-7 text-cyan-400" />
              Devices
              <span className="text-sm font-normal text-gray-400">({devices.length})</span>
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                {onlineCount} Online
              </span>
              <span className="hidden sm:inline text-gray-500">•</span>
              <span className="text-gray-400">{devices.length - onlineCount} Offline</span>
            </div>
          </div>
        </div>

        {/* Loading / Empty State */}
        {initializing ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20">
            <WifiOff className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">কোনো ডিভাইস এখনো কানেক্ট হয়নি</p>
            <p className="text-sm text-gray-500 mt-2">Devices will appear automatically when online</p>
          </div>
        ) : (
          /* Responsive Grid: 1 col → 2 col → 3 col → 4 col */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {sortedDevices.map((device, i) => (
                <DeviceCard key={device.deviceId} device={device} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini Status Box - Perfect for Mobile
const StatusBox = ({ icon, label, value, active, glow }) => (
  <div className={`rounded-2xl p-4 backdrop-blur-xl border ${active ? "bg-emerald-500/10 border-emerald-500/40" : "bg-red-500/10 border-red-500/40"} ${glow ? "shadow-lg shadow-cyan-500/30" : ""}`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${active ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
        <div className={active ? "text-emerald-400" : "text-red-400"}>{icon}</div>
      </div>
    </div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm font-bold">{value || (active ? "OK" : "No")}</p>
  </div>
);

// BEAUTIFUL RESPONSIVE ACTIVE-FIRST CARD
const DeviceCard = ({ device, index }) => {
  const { deviceId, deviceName, deviceUserName, active, lastSeen } = device;
  const name = deviceUserName || deviceName || "Unnamed Device";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border-2 transition-all duration-500
        ${active 
          ? "bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-cyan-600/20 border-emerald-400/60 shadow-2xl shadow-emerald-500/30" 
          : "bg-gray-900/50 border-gray-700/50 shadow-lg"
        }`}
    >
      {/* Active Glow Ring */}
      {active && (
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg truncate pr-2">{name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-1 truncate">{deviceId}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${active ? "bg-emerald-500/20" : "bg-gray-700/50"}`}>
            {active ? <Wifi className="w-6 h-6 text-emerald-400 animate-pulse" /> : <WifiOff className="w-6 h-6 text-gray-500" />}
          </div>
        </div>

        {/* Status Badge + Last Seen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-fit
            ${active 
              ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/50" 
              : "bg-gray-700/50 text-gray-400"
            }`}>
            {active ? "● Online" : "○ Offline"}
          </span>

          {lastSeen && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Active Bottom Bar */}
        {active && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400"></div>
        )}
      </div>
    </motion.div>
  );
};

export default DeviceMonitoring;