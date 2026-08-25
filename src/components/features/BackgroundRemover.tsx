import { useState, useCallback } from "react";
import { Wand2, Loader2, CheckCircle2, AlertCircle, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BackgroundRemoverProps {
  image: HTMLImageElement | null;
  onResult: (processedImg: HTMLImageElement) => void;
  bgColor: string;
}

type RemovalStatus = "idle" | "loading-model" | "processing" | "done" | "error";

export default function BackgroundRemover({ image, onResult, bgColor }: BackgroundRemoverProps) {
  const [status, setStatus] = useState<RemovalStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const removeBackground = useCallback(async () => {
    if (!image) {
      toast.error("Please upload a photo first");
      return;
    }

    setStatus("loading-model");
    setProgress(10);

    try {
      // Dynamically import to avoid blocking initial load
      const { removeBackground: removeBg } = await import("@imgly/background-removal");
      setProgress(30);
      setStatus("processing");

      // Convert HTMLImageElement to Blob
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);

      setProgress(50);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      setProgress(65);

      const resultBlob = await removeBg(blob, {
        progress: (key: string, current: number, total: number) => {
          const pct = Math.round((current / total) * 100);
          setProgress(65 + Math.round(pct * 0.25)); // 65–90%
        },
      });

      setProgress(90);

      // Composite result onto chosen background color
      const resultUrl = URL.createObjectURL(resultBlob);
      const fgImg = new Image();
      fgImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve) => {
        fgImg.onload = () => {
          const outCanvas = document.createElement("canvas");
          outCanvas.width = fgImg.width;
          outCanvas.height = fgImg.height;
          const outCtx = outCanvas.getContext("2d")!;

          // Fill background
          outCtx.fillStyle = bgColor;
          outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

          // Draw foreground (person)
          outCtx.drawImage(fgImg, 0, 0);

          const finalUrl = outCanvas.toDataURL("image/png");
          setPreviewUrl(finalUrl);

          // Create HTMLImageElement for downstream processing
          const outImg = new window.Image();
          outImg.onload = () => {
            onResult(outImg);
            resolve();
          };
          outImg.src = finalUrl;

          URL.revokeObjectURL(resultUrl);
        };
        fgImg.src = resultUrl;
      });

      setProgress(100);
      setStatus("done");
      toast.success("Background removed successfully!");
    } catch (err) {
      console.error("BG removal error:", err);
      setStatus("error");
      toast.error("Background removal failed. Try a clearer photo.");
    }
  }, [image, bgColor, onResult]);

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setPreviewUrl("");
  };

  const statusMessages: Record<RemovalStatus, string> = {
    idle: "Remove background with AI",
    "loading-model": "Loading AI model...",
    processing: "Removing background...",
    done: "Background removed!",
    error: "Removal failed — try again",
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-[#0a1628]">
          <img src={previewUrl} alt="BG removed" className="w-full max-h-48 object-contain" />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Applied
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(status === "loading-model" || status === "processing") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {status === "loading-model" ? "Downloading AI model (~5MB first time)..." : "Processing image..."}
            </span>
            <span className="text-xs text-cyan-400 font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={status === "done" || status === "error" ? reset : removeBackground}
        disabled={status === "loading-model" || status === "processing" || !image}
        className={cn(
          "w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all duration-200",
          status === "done"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : status === "error"
            ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : status === "loading-model" || status === "processing"
            ? "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
            : !image
            ? "border border-white/10 bg-white/5 text-slate-600 cursor-not-allowed"
            : "border border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 shadow-lg shadow-violet-500/10"
        )}
      >
        {status === "loading-model" || status === "processing" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === "done" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : status === "error" ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {status === "done" ? "Apply Again" : status === "error" ? "Retry" : statusMessages[status]}
      </button>

      {/* Info Note */}
      {status === "idle" && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <Palette className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            AI model runs <strong className="text-slate-400">100% in your browser</strong>. First run downloads ~5MB model. No photo is sent to any server.
          </p>
        </div>
      )}
    </div>
  );
}
