import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import PhotoUpload from "@/components/features/PhotoUpload";
import SpecSelector from "@/components/features/SpecSelector";
import PhotoEditor from "@/components/features/PhotoEditor";
import BackgroundRemover from "@/components/features/BackgroundRemover";
import FaceGuideOverlay from "@/components/features/FaceGuideOverlay";
import { PHOTO_SPECS } from "@/constants/specs";
import { PhotoSpec } from "@/types";
import { processImage } from "@/lib/imageProcessing";
import { Settings2, Info, CheckCircle2, Wand2, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Editor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedSpec, setSelectedSpec] = useState<PhotoSpec>(PHOTO_SPECS[0]);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"spec" | "bg" | "ai-bg" | "face">("spec");
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  const handleImageLoad = useCallback((img: HTMLImageElement, file: File) => {
    setImage(img);
    setFileName(file.name || "sample-photo.jpg");
    toast.success("Photo loaded! Adjust settings and download.");
  }, []);

  const handleClear = () => {
    setImage(null);
    setFileName("");
    setProcessedUrl("");
  };

  const handleSpecChange = (spec: PhotoSpec) => {
    setSelectedSpec(spec);
    if (image) {
      const url = processImage(image, spec, bgColor);
      setProcessedUrl(url);
    }
  };

  // Handle BG removal result — replace working image
  const handleBgRemoved = (newImg: HTMLImageElement) => {
    setImage(newImg);
    toast.success("Background removed — photo updated in editor!");
  };

  // Measure preview container for face overlay
  useEffect(() => {
    if (!previewRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const el = entries[0].contentRect;
      setPreviewSize({ w: el.width, h: el.height });
    });
    ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, []);

  // Save to history
  useEffect(() => {
    if (processedUrl) {
      const history = JSON.parse(localStorage.getItem("photo_history") || "[]");
      const entry = {
        id: Date.now(),
        specName: selectedSpec.name,
        dataUrl: processedUrl,
        timestamp: Date.now(),
      };
      if (!history[0] || history[0].dataUrl !== processedUrl) {
        history.unshift(entry);
        localStorage.setItem("photo_history", JSON.stringify(history.slice(0, 20)));
        const stats = JSON.parse(localStorage.getItem("photo_stats") || '{"totalProcessed":0,"todayProcessed":0,"sessionProcessed":0,"totalDownloads":0}');
        stats.totalProcessed = (stats.totalProcessed || 0) + 1;
        stats.todayProcessed = (stats.todayProcessed || 0) + 1;
        stats.sessionProcessed = (stats.sessionProcessed || 0) + 1;
        localStorage.setItem("photo_stats", JSON.stringify(stats));
      }
    }
  }, [processedUrl]);

  const bgPresets = [
    { color: "#FFFFFF", label: "White" },
    { color: "#F0F8FF", label: "Ice Blue" },
    { color: "#F5F5DC", label: "Cream" },
    { color: "#E8F5E9", label: "Light Green" },
    { color: "#FFF3E0", label: "Warm" },
  ];

  const leftPanels = [
    { id: "spec" as const, label: "Spec", icon: "📐", step: "2" },
    { id: "bg" as const, label: "Background", icon: "🎨", step: null },
    { id: "ai-bg" as const, label: "AI Remove BG", icon: "✨", step: null },
    { id: "face" as const, label: "Face Check", icon: "👤", step: null },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Photo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Editor</span>
            </h1>
            <p className="text-slate-400 mt-1">
              Upload your photo, select specification, and download in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel */}
            <div className="lg:col-span-4 space-y-4">
              {/* Step 1: Upload */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
                  Upload Photo
                </h2>
                {fileName && (
                  <p className="text-xs text-slate-500 mb-2 truncate">📎 {fileName}</p>
                )}
                <PhotoUpload
                  onImageLoad={handleImageLoad}
                  hasImage={!!image}
                  onClear={handleClear}
                />
              </div>

              {/* Step 2+: Settings Tabs */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
                {/* Tab Buttons */}
                <div className="grid grid-cols-2 gap-1 mb-4">
                  {leftPanels.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => setActivePanel(panel.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200",
                        activePanel === panel.id
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {panel.step && (
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {panel.step}
                        </span>
                      )}
                      <span>{panel.icon}</span>
                      <span className="truncate">{panel.label}</span>
                    </button>
                  ))}
                </div>

                {/* Panel Content */}
                {activePanel === "spec" && (
                  <SpecSelector selected={selectedSpec} onChange={handleSpecChange} />
                )}

                {activePanel === "bg" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Choose background color:</p>
                    <div className="flex gap-2 flex-wrap">
                      {bgPresets.map(({ color, label }) => (
                        <button
                          key={color}
                          onClick={() => setBgColor(color)}
                          title={label}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                            bgColor === color ? "border-cyan-400 scale-110" : "border-white/20"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Custom:</label>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs text-slate-500 font-mono">{bgColor}</span>
                    </div>
                  </div>
                )}

                {activePanel === "ai-bg" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-semibold text-white">AI Background Removal</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Automatically detects and removes photo background, replacing it with your chosen color.
                    </p>
                    {/* BG color picker for AI removal */}
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Replace with:</p>
                      <div className="flex gap-2 flex-wrap">
                        {bgPresets.map(({ color, label }) => (
                          <button
                            key={color}
                            onClick={() => setBgColor(color)}
                            title={label}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                              bgColor === color ? "border-cyan-400 scale-110" : "border-white/20"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                    <BackgroundRemover
                      image={image}
                      onResult={handleBgRemoved}
                      bgColor={bgColor}
                    />
                  </div>
                )}

                {activePanel === "face" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <p className="text-sm font-semibold text-white">Face Detection Check</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Detects face position and shows guides for head size, eye alignment, and centering against passport standards.
                    </p>
                    <FaceGuideOverlay
                      image={image}
                      displayWidth={previewSize.w}
                      displayHeight={previewSize.h}
                    />
                  </div>
                )}
              </div>

              {/* Spec Info */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm font-semibold text-cyan-300">{selectedSpec.flag} {selectedSpec.name}</p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  {[
                    { label: "Size", value: `${selectedSpec.width} × ${selectedSpec.height} px` },
                    { label: "Resolution", value: `${selectedSpec.dpi} DPI` },
                    { label: "Max File Size", value: `${selectedSpec.maxSizeKB} KB` },
                    { label: "Background", value: "White" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}:</span>
                      <span className="text-slate-300 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Editor */}
            <div className="lg:col-span-8">
              {image ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
                    Adjust & Download
                    <span className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Photo Ready
                    </span>
                  </h2>
                  {/* Photo editor with face overlay ref */}
                  <div ref={previewRef} className="relative">
                    <PhotoEditor
                      image={image}
                      spec={selectedSpec}
                      bgColor={bgColor}
                      onProcessed={setProcessedUrl}
                    />
                    {/* Face overlay rendered inside PhotoEditor via absolute positioning in its canvas */}
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-96 rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-6">
                    <span className="text-5xl">📸</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Photo Uploaded</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Upload a photo from the left panel to begin editing. Your processed photo will appear here.
                  </p>
                  <div className="mt-8 grid grid-cols-4 gap-3 w-full max-w-md">
                    {["Auto Resize", "AI BG Remove", "Face Check", "PDF Export"].map((f) => (
                      <div key={f} className="rounded-xl border border-white/10 bg-white/5 py-3 px-2 text-center">
                        <p className="text-xs text-slate-400">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
