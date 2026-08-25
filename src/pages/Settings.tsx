import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Sun, Moon, Gauge, Image, Bell, Shield, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppSettings {
  quality: "high" | "medium" | "low";
  autoSave: boolean;
  notifications: boolean;
  defaultBg: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  quality: "high",
  autoSave: true,
  notifications: true,
  defaultBg: "#FFFFFF",
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("app_settings") || "null");
    if (saved) setSettings(saved);
  }, []);

  const save = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("app_settings", JSON.stringify(newSettings));
    toast.success("Settings saved!");
  };

  const toggle = (key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key as keyof typeof settings] };
    save(updated as AppSettings);
  };

  const qualityOptions = [
    { value: "high", label: "High Quality", desc: "Best quality, larger file size", quality: "92%" },
    { value: "medium", label: "Medium", desc: "Balanced quality and size", quality: "75%" },
    { value: "low", label: "Compressed", desc: "Smallest file size", quality: "55%" },
  ] as const;

  const bgPresets = [
    { color: "#FFFFFF", label: "White (Standard)" },
    { color: "#F0F8FF", label: "Alice Blue" },
    { color: "#F5F5DC", label: "Beige/Cream" },
    { color: "#E8F5E9", label: "Light Green" },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Settings</span>
            </h1>
            <p className="text-slate-400 mt-1">Customize your AI Photo Studio Pro experience</p>
          </div>

          <div className="space-y-4">
            {/* Quality */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
                <Gauge className="w-5 h-5 text-cyan-400" />
                Image Quality
              </h2>
              <div className="space-y-2">
                {qualityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => save({ ...settings, quality: opt.value })}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      settings.quality === opt.value
                        ? "border-cyan-500/40 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-sm font-medium", settings.quality === opt.value ? "text-cyan-300" : "text-white")}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono">{opt.quality}</span>
                      {settings.quality === opt.value && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Background */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
                <Image className="w-5 h-5 text-violet-400" />
                Default Background Color
              </h2>
              <div className="flex gap-3 flex-wrap">
                {bgPresets.map(({ color, label }) => (
                  <button
                    key={color}
                    onClick={() => save({ ...settings, defaultBg: color })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                      settings.defaultBg === color
                        ? "border-cyan-500/40 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div
                      className="w-5 h-5 rounded-md border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-slate-300">{label}</span>
                    {settings.defaultBg === color && (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { key: "autoSave" as const, label: "Auto Save to History", desc: "Automatically save processed photos to history", icon: Bell },
                  { key: "notifications" as const, label: "Toast Notifications", desc: "Show success/error notifications", icon: Bell },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-white font-medium">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-all duration-300",
                        settings[key] ? "bg-cyan-500" : "bg-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300",
                          settings[key] ? "left-7" : "left-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-cyan-300 mb-3">
                <Info className="w-5 h-5" />
                About AI Photo Studio Pro
              </h2>
              <div className="space-y-1 text-sm text-slate-400">
                <p><span className="text-slate-500">Version:</span> <span className="text-slate-300">1.0.0</span></p>
                <p><span className="text-slate-500">Processing:</span> <span className="text-slate-300">100% In-Browser (Canvas API)</span></p>
                <p><span className="text-slate-500">Privacy:</span> <span className="text-emerald-400">Photos never leave your device</span></p>
                <p><span className="text-slate-500">Specs Supported:</span> <span className="text-slate-300">15+ Government & International</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
