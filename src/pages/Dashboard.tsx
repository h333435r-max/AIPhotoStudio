import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatsCard from "@/components/features/StatsCard";
import { Camera, Download, Image, Clock, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { StatsData } from "@/types";

interface HistoryEntry {
  id: number;
  specName: string;
  dataUrl: string;
  timestamp: number;
}

const DEFAULT_STATS: StatsData = {
  totalProcessed: 0,
  todayProcessed: 0,
  sessionProcessed: 0,
  totalDownloads: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData>(DEFAULT_STATS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("photo_stats") || "null");
    if (s) setStats(s);
    const h = JSON.parse(localStorage.getItem("photo_history") || "[]");
    setHistory(h);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("photo_history");
    localStorage.removeItem("photo_stats");
    setHistory([]);
    setStats(DEFAULT_STATS);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" });
  };

  const downloadPhoto = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name.replace(/\s/g, "-").toLowerCase()}-photo.jpg`;
    a.click();

    // Update download count
    const s = JSON.parse(localStorage.getItem("photo_stats") || '{"total":0,"today":0,"session":0,"downloads":0}');
    s.downloads = (s.downloads || 0) + 1;
    localStorage.setItem("photo_stats", JSON.stringify(s));
    setStats((prev) => ({ ...prev, totalDownloads: prev.totalDownloads + 1 }));
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</span>
              </h1>
              <p className="text-slate-400 mt-1">Your photo processing history and statistics</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear History
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Camera}
              label="Total Processed"
              value={stats.totalProcessed}
              subValue="All time"
              color="cyan"
            />
            <StatsCard
              icon={Clock}
              label="Today"
              value={stats.todayProcessed}
              subValue="Photos today"
              color="blue"
            />
            <StatsCard
              icon={Image}
              label="This Session"
              value={stats.sessionProcessed}
              subValue="Current session"
              color="green"
            />
            <StatsCard
              icon={Download}
              label="Downloads"
              value={stats.totalDownloads}
              subValue="Total downloads"
              color="purple"
            />
          </div>

          {/* History */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Recent Photos
              </h2>
              <span className="text-xs text-slate-500">{history.length} photos</span>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No Photos Yet</h3>
                <p className="text-slate-600 text-sm mb-6">Start editing photos to see your history here</p>
                <Link
                  to="/editor"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all"
                >
                  Start Editing Photos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-cyan-500/30 transition-all duration-200 hover:scale-105"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-[#0a1628]">
                      <img
                        src={entry.dataUrl}
                        alt={entry.specName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-white font-medium truncate">{entry.specName}</p>
                      <p className="text-xs text-slate-600">{formatTime(entry.timestamp)}</p>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => downloadPhoto(entry.dataUrl, entry.specName)}
                        className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link
                        to="/editor"
                        className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="Edit Again"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
