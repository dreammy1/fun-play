import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Filter,
  Search,
  Clock,
  Smartphone,
  User,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

const STATUS_COLORS = {
  true: {
    bg: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-400/50",
    text: "text-emerald-300",
    glow: "shadow-emerald-500/30",
    label: "ক্রেডিট হয়েছে",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  false: {
    bg: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-400/50",
    text: "text-yellow-300",
    glow: "shadow-yellow-500/20",
    label: "পেন্ডিং",
    icon: <XCircle className="w-5 h-5" />,
  },
};

const METHOD_LABEL = { bkash: "Bkash", nagad: "Nagad", rocket: "Rocket", upay: "Upay" };

const OpayDeposit = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  // Filters
  const [fUsername, setFUsername] = useState("");
  const [fMethod, setFMethod] = useState("");
  const [fApplied, setFApplied] = useState("");
  const [fTrxid, setFTrxid] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (fUsername) params.set("username", fUsername.trim());
    if (fMethod) params.set("method", fMethod);
    if (fApplied) params.set("applied", fApplied);
    if (fTrxid) params.set("trxid", fTrxid.trim());
    if (fFrom) params.set("from", fFrom.trim());
    if (fDateFrom) params.set("dateFrom", fDateFrom);
    if (fDateTo) params.set("dateTo", fDateTo);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [fUsername, fMethod, fApplied, fTrxid, fFrom, fDateFrom, fDateTo, page]);

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_API_URL}/opay/deposits?${queryString}`
      );
      if (res.data?.success) {
        setItems(res.data.data || []);
        setTotal(res.data.total || 0);
      } else {
        setError(res.data?.message || "Failed to load deposits");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [queryString]);

  const resetFilters = () => {
    setFUsername("");
    setFMethod("");
    setFApplied("");
    setFTrxid("");
    setFFrom("");
    setFDateFrom("");
    setFDateTo("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            Opay Deposits
          </h1>
          <p className="mt-2 text-gray-400 text-sm">সকল ডিপোজিট — টাচ করুন বিস্তারিত দেখতে</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center sm:justify-between items-center">
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={fetchDeposits} disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 hover:bg-cyan-500/30 transition-all disabled:opacity-60 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={resetFilters}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/20 border border-purple-400/50 hover:bg-purple-500/30 transition-all text-sm">
              <Filter className="w-4 h-4" /> রিসেট
            </motion.button>
          </div>
          <div className="text-sm text-gray-400">
            মোট: <span className="font-bold text-cyan-400">{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Filters - Mobile Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 text-sm">
          <FilterInput icon={<User className="w-4 h-4" />} placeholder="Username" value={fUsername} onChange={setFUsername} setPage={setPage} />
          <FilterInput icon={<Search className="w-4 h-4" />} placeholder="TrxID" value={fTrxid} onChange={setFTrxid} setPage={setPage} />
          <FilterInput icon={<Smartphone className="w-4 h-4" />} placeholder="From" value={fFrom} onChange={setFFrom} setPage={setPage} />

          <select value={fMethod} onChange={(e) => { setFMethod(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-white/5 border border-gray-700/50 backdrop-blur-xl text-sm focus:outline-none focus:border-cyan-400/70">
            <option value="">All Methods</option>
            <option value="bkash">Bkash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="upay">Upay</option>
          </select>

          <select value={fApplied} onChange={(e) => { setFApplied(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-white/5 border border-gray-700/50 backdrop-blur-xl text-sm focus:outline-none focus:border-cyan-400/70">
            <option value="">All Status</option>
            <option value="true">Credited</option>
            <option value="false">Pending</option>
          </select>

          <div className="flex gap-2 col-span-full sm:col-span-2 lg:col-span-1">
            <input type="date" value={fDateFrom} onChange={(e) => { setFDateFrom(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-gray-700/50 backdrop-blur-xl text-sm focus:outline-none focus:border-cyan-400/70" />
            <input type="date" value={fDateTo} onChange={(e) => { setFDateTo(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-gray-700/50 backdrop-blur-xl text-sm focus:outline-none focus:border-cyan-400/70" />
          </div>
        </div>

        {/* Error / Loading */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/40 backdrop-blur text-center text-sm">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Mobile Card View + Desktop Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">কোনো ডিপোজিট পাওয়া যায়নি</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card List */}
            <div className="block lg:hidden space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((d, i) => (
                  <MobileDepositCard key={d._id} deposit={d} index={i} onClick={() => setSelectedDeposit(d)} />
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30">
                    <Th>সময়</Th>
                    <Th>User</Th>
                    <Th>Amount</Th>
                    <Th>Method</Th>
                    <Th>TrxID</Th>
                    <Th>From</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => (
                    <TableRow key={d._id} deposit={d} index={i} onClick={() => setSelectedDeposit(d)} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-gray-700 disabled:opacity-50 hover:bg-white/10 transition-all text-sm">
                  <ChevronLeft className="w-5 h-5" /> আগে
                </button>
                <span className="text-cyan-400 font-bold">পৃষ্ঠা {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-gray-700 disabled:opacity-50 hover:bg-white/10 transition-all text-sm">
                  পরে <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Full Detail Modal */}
        <AnimatePresence>
          {selectedDeposit && (
            <DetailModal deposit={selectedDeposit} onClose={() => setSelectedDeposit(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Mobile Card
const MobileDepositCard = ({ deposit, index, onClick }) => {
  const status = STATUS_COLORS[!!deposit.applied];
  const ts = deposit.appliedAt || deposit.receivedAt || deposit.time || Date.now();
  const timeAgo = formatDistanceToNow(new Date(ts), { addSuffix: true, locale: bn });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border-2 ${status.border} ${status.glow} bg-gradient-to-br ${status.bg} p-5 cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-2xl font-bold text-cyan-300">৳{(deposit.amount || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-300">{METHOD_LABEL[deposit.method] || deposit.method}</p>
        </div>
        {status.icon}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">User</span>
          <span className="font-medium">{deposit.userInfo?.username || deposit.username || "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">TrxID</span>
          <span className="font-mono text-xs">{(deposit.trxid || "-").slice(0, 16)}...</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-4 h-4" />
          {timeAgo}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/20 text-center text-cyan-300 text-xs font-medium">
        টাচ করুন বিস্তারিত দেখতে →
      </div>
    </motion.div>
  );
};

// Desktop Table Row
const TableRow = ({ deposit, index, onClick }) => {
  const status = STATUS_COLORS[!!deposit.applied];
  const ts = deposit.appliedAt || deposit.receivedAt || deposit.time || Date.now();
  const timeAgo = formatDistanceToNow(new Date(ts), { addSuffix: true, locale: bn });

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className="border-t border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-300 group"
    >
      <Td><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> {timeAgo}</div></Td>
      <Td className="font-medium">{deposit.userInfo?.username || deposit.username || "N/A"}</Td>
      <Td className="font-bold text-cyan-300">৳{(deposit.amount || 0).toLocaleString()}</Td>
      <Td>{METHOD_LABEL[deposit.method] || deposit.method}</Td>
      <Td className="font-mono text-xs">{(deposit.trxid || "-").slice(0, 12)}...</Td>
      <Td>{deposit.from || "-"}</Td>
      <Td>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.border} ${status.text} bg-white/5`}>
          {status.label}
        </span>
      </Td>
      <Td>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-cyan-400" />
        </div>
      </Td>
    </motion.tr>
  );
};

// Full Detail Modal (Same as before but mobile optimized)
const DetailModal = ({ deposit, onClose }) => {
  const status = STATUS_COLORS[!!deposit.applied];
  const ts = deposit.appliedAt || deposit.receivedAt || deposit.time || Date.now();
  const timeAgo = formatDistanceToNow(new Date(ts), { addSuffix: true, locale: bn });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-screen overflow-y-auto rounded-3xl backdrop-blur-2xl border-2 bg-gradient-to-br from-slate-900/90 to-purple-900/90"
        style={{ borderColor: status.border.replace("border-", "").replace("/50", "") }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-cyan-300">৳{(deposit.amount || 0).toLocaleString()}</h2>
            <p className="text-xl mt-2 opacity-90">{METHOD_LABEL[deposit.method] || deposit.method}</p>
            <div className="mt-4 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border-2">
              {status.icon}
              <span className="font-bold text-lg">{status.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <Info label="Username" value={deposit.userInfo?.username || deposit.username || "N/A"} icon={<User />} />
            <Info label="Balance" value={deposit.userInfo?.balance != null ? `৳${deposit.userInfo.balance}` : "N/A"} icon={<DollarSign />} />
            <Info label="TrxID" value={deposit.trxid || "-"} icon={<Hash />} mono />
            <Info label="From" value={deposit.from || "-"} icon={<Smartphone />} />
            <Info label="Device" value={deposit.deviceName || deposit.deviceId || "N/A"} />
            <Info label="Token" value={deposit.token || "-"} mono />
            <Info label="Success" value={deposit.success ? "হ্যাঁ" : "না"} />
            <Info label="BD Time" value={deposit.bdTimeZone || "-"} icon={<Calendar />} />
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{timeAgo}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Reusable Components
const FilterInput = ({ icon, placeholder, value, onChange, setPage }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{icon}</div>
    <input
      value={value}
      onChange={(e) => { onChange(e.target.value); setPage(1); }}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-gray-700/50 backdrop-blur-xl text-sm focus:outline-none focus:border-cyan-400/70 transition-all"
    />
  </div>
);

const Th = ({ children }) => <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{children}</th>;
const Td = ({ children }) => <td className="px-4 py-4 text-sm text-gray-200">{children}</td>;
const Info = ({ label, value, icon, mono }) => (
  <div className="flex items-center gap-3">
    {icon && <div className="text-cyan-400">{icon}</div>}
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`font-medium ${mono ? "font-mono text-xs" : "text-base"}`}>{value}</p>
    </div>
  </div>
);

export default OpayDeposit;