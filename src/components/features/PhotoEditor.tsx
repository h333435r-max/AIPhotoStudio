import { useRef, useEffect, useState } from "react";
import { PhotoSpec } from "@/types";
import { applyAdjustments } from "@/lib/imageProcessing";
import {
  Sun, Contrast, Palette, Download,
  FileText, RefreshCw, Scissors
} from "lucide-react";
import CropTool from "@/components/features/CropTool";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generatePDFSheet, getImageSizeKB } from "@/lib/imageProcessing";

interface PhotoEditorProps {
  image: HTMLImageElement;
  spec: PhotoSpec;
  bgColor: string;
  onProcessed: (dataUrl: string) => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  rotation: number;
}

const DEFAULT_ADJ: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  cropX: 0,
  cropY: 0,
  cropW: 1,
  cropH: 1,
  rotation: 0,
};

export default function PhotoEditor({ image, spec, bgColor, onProcessed }: PhotoEditorProps) {
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [copies, setCopies] = useState(4);
  const [activeTab, setActiveTab] = useState<"adjust" | "crop">("adjust");

  useEffect(() => {
    setAdj(DEFAULT_ADJ);
  }, [image, spec]);

  useEffect(() => {
    const url = applyAdjustments(image, spec, bgColor, adj);
    setProcessedUrl(url);
    onProcessed(url);
  }, [image, spec, bgColor, adj]);

  const update = (key: keyof Adjustments, value: number) => {
    setAdj((prev) => ({ ...prev, [key]: value }));
  };

  const rotate = (deg: number) => {
    update("rotation", ((adj.rotation + deg) % 360 + 360) % 360);
  };

  const reset = () => setAdj(DEFAULT_ADJ);

  const downloadJPG = () => {
    if (!processedUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl;
    a.download = `${spec.id}-photo.jpg`;
    a.click();
    toast.success("JPG downloaded successfully!");
  };

  const downloadPNG = () => {
    if (!processedUrl) return;
    const img2 = new window.Image();
    img2.onload = () => {
      const c = document.createElement("canvas");
      c.width = img2.width;
      c.height = img2.height;
      c.getContext("2d")!.drawImage(img2, 0, 0);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${spec.id}-photo.png`;
      a.click();
      toast.success("PNG downloaded successfully!");
    };
    img2.src = processedUrl;
  };

  const downloadPDF = () => {
    if (!processedUrl) return;
    generatePDFSheet(processedUrl, copies, spec.name);
    toast.success(`PDF sheet with ${copies} photos opened for printing!`);
  };

  const sizeKB = processedUrl ? getImageSizeKB(processedUrl) : 0;

  const sliders = [
    { key: "brightness" as const, label: "Brightness", icon: Sun, min: 50, max: 200, color: "text-yellow-400" },
    { key: "contrast" as const, label: "Contrast", icon: Contrast, min: 50, max: 200, color: "text-blue-400" },
    { key: "saturation" as const, label: "Saturation", icon: Palette, min: 0, max: 200, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0a1628] border border-white/10 flex items-center justify-center"
        style={{ minHeight: 280 }}>
        {processedUrl ? (
          <>
            <img
              src={processedUrl}
              alt="Processed"
              className="max-h-72 max-w-full object-contain rounded-xl shadow-2xl"
            />
            {/* Info overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-xs text-cyan-400 font-mono">
                  {spec.width} × {spec.height}px
                </span>
                <span className={cn(
                  "px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-xs font-mono",
                  sizeKB <= spec.maxSizeKB ? "text-emerald-400" : "text-red-400"
                )}>
                  {sizeKB} KB / {spec.maxSizeKB} KB
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-xs text-slate-400">
                {spec.dpi} DPI
              </span>
            </div>
          </>
        ) : (
          <div className="text-slate-600 text-sm">Processing...</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {(["adjust", "crop"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 capitalize",
              activeTab === tab
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            {tab === "adjust" ? "🎨 Adjustments" : "✂️ Crop & Rotate"}
          </button>
        ))}
      </div>

      {activeTab === "adjust" && (
        <div className="space-y-4">
          {sliders.map(({ key, label, icon: Icon, min, max, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", color)} />
                  <span className="text-sm text-slate-300 font-medium">{label}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{adj[key]}%</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={adj[key]}
                onChange={(e) => update(key, Number(e.target.value))}
                className="w-full h-2 rounded-full accent-cyan-500 bg-white/10 cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === "crop" && (
        <CropTool
          image={image}
          specAspect={spec.width / spec.height}
          cropRect={{ x: adj.cropX, y: adj.cropY, w: adj.cropW, h: adj.cropH }}
          rotation={adj.rotation}
          onChange={(crop) =>
            setAdj((prev) => ({
              ...prev,
              cropX: crop.x,
              cropY: crop.y,
              cropW: crop.w,
              cropH: crop.h,
            }))
          }
          onRotate={(deg) => rotate(deg)}
        />
      )}

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-all"
      >
        <RefreshCw className="w-4 h-4" /> Reset All Adjustments
      </button>

      {/* Download Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          Download Options
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={downloadJPG}
            className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200"
          >
            ⬇ JPG
          </button>
          <button
            onClick={downloadPNG}
            className="py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-all duration-200"
          >
            ⬇ PNG
          </button>
        </div>

        {/* PDF Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Photos per sheet:</span>
            <div className="flex gap-1">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setCopies(n)}
                  className={cn(
                    "w-8 h-7 rounded-lg text-xs font-semibold transition-all",
                    copies === n
                      ? "bg-violet-500/30 text-violet-300 border border-violet-500/40"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:text-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={downloadPDF}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-bold hover:bg-violet-500/20 transition-all duration-200"
          >
            <FileText className="w-4 h-4" />
            Print PDF Sheet ({copies} photos)
          </button>
        </div>
      </div>
    </div>
  );
}
