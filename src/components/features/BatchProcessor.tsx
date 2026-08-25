import { useState, useCallback, useRef } from "react";
import { Upload, X, Download, Loader2, CheckCircle2, FileArchive, Trash2, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PhotoSpec } from "@/types";
import { applyAdjustments } from "@/lib/imageProcessing";
import SpecSelector from "./SpecSelector";
import { PHOTO_SPECS } from "@/constants/specs";

interface BatchFile {
  id: string;
  file: File;
  img: HTMLImageElement;
  status: "pending" | "processing" | "done" | "error";
  dataUrl?: string;
  errorMsg?: string;
}

export default function BatchProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<PhotoSpec>(PHOTO_SPECS[0]);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const addFiles = useCallback((rawFiles: FileList | File[]) => {
    const imageFiles = Array.from(rawFiles).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please select image files only (JPG, PNG, WEBP)");
      return;
    }
    if (files.length + imageFiles.length > 50) {
      toast.error("Maximum 50 photos allowed at once");
      return;
    }

    const newEntries: BatchFile[] = [];
    let loaded = 0;

    for (const file of imageFiles) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        newEntries.push({ id, file, img, status: "pending" });
        loaded++;
        if (loaded === imageFiles.length) {
          setFiles((prev) => [...prev, ...newEntries]);
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    }
    toast.success(`${imageFiles.length} photo${imageFiles.length > 1 ? "s" : ""} added`);
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const processAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);

    const updated = [...files];
    let count = 0;

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "processing" };
      setFiles([...updated]);

      try {
        const dataUrl = applyAdjustments(updated[i].img, selectedSpec, bgColor, {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          cropX: 0,
          cropY: 0,
          cropW: 1,
          cropH: 1,
          rotation: 0,
        });
        updated[i] = { ...updated[i], status: "done", dataUrl };
        count++;
        setProcessedCount(count);
      } catch {
        updated[i] = { ...updated[i], status: "error", errorMsg: "Processing failed" };
      }

      setFiles([...updated]);
      // Small delay to prevent UI freeze
      await new Promise((r) => setTimeout(r, 40));
    }

    setIsProcessing(false);
    toast.success(`${count} photo${count > 1 ? "s" : ""} processed successfully!`);
  };

  const downloadZip = async () => {
    const doneFiles = files.filter((f) => f.status === "done" && f.dataUrl);
    if (doneFiles.length === 0) {
      toast.error("Process photos first before downloading ZIP");
      return;
    }

    setIsZipping(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(`${selectedSpec.id}-photos`)!;
      const ts = Date.now();

      for (let i = 0; i < doneFiles.length; i++) {
        const f = doneFiles[i];
        // Convert base64 dataUrl to binary
        const base64 = f.dataUrl!.split(",")[1];
        const fname = `${selectedSpec.id}_${ts}_${String(i + 1).padStart(3, "0")}.jpg`;
        folder.file(fname, base64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selectedSpec.id}-batch-${ts}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`ZIP downloaded with ${doneFiles.length} photos!`);
    } catch (err) {
      console.error("ZIP error:", err);
      toast.error("Failed to create ZIP file");
    } finally {
      setIsZipping(false);
    }
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  const bgPresets = [
    { color: "#FFFFFF", label: "White" },
    { color: "#F0F8FF", label: "Ice Blue" },
    { color: "#F5F5DC", label: "Cream" },
    { color: "#E8F5E9", label: "Light Green" },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Batch <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Processor</span>
          </h1>
          <p className="text-slate-400 mt-1">Upload multiple photos, apply one spec, download as ZIP</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Config */}
          <div className="lg:col-span-4 space-y-4">
            {/* Upload */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Upload Photos (Max 50)</h2>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300",
                  isDragging
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-white/20 bg-white/5 hover:border-cyan-500/40 hover:bg-white/8"
                )}
              >
                <Upload className={cn("w-8 h-8 mx-auto mb-2 transition-colors", isDragging ? "text-cyan-400" : "text-slate-500")} />
                <p className="text-sm text-slate-300 font-medium">Drop photos here</p>
                <p className="text-xs text-slate-600 mt-1">or click to browse multiple files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Spec */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Photo Specification</h2>
              <SpecSelector selected={selectedSpec} onChange={setSelectedSpec} />
            </div>

            {/* Background */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Background Color</h2>
              <div className="flex gap-2 flex-wrap">
                {bgPresets.map(({ color, label }) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    title={label}
                    className={cn(
                      "w-9 h-9 rounded-xl border-2 transition-all hover:scale-110",
                      bgColor === color ? "border-cyan-400 scale-110" : "border-white/20"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={processAll}
                disabled={isProcessing || files.length === 0}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200",
                  isProcessing || files.length === 0
                    ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing {processedCount}/{files.length}...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    Process All {files.length > 0 ? `(${files.length})` : ""} Photos
                  </>
                )}
              </button>

              <button
                onClick={downloadZip}
                disabled={doneCount === 0 || isZipping}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200",
                  doneCount === 0 || isZipping
                    ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                )}
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" />
                    Download ZIP {doneCount > 0 ? `(${doneCount} photos)` : ""}
                  </>
                )}
              </button>

              {files.length > 0 && (
                <button
                  onClick={() => { setFiles([]); setProcessedCount(0); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Photos
                </button>
              )}
            </div>
          </div>

          {/* Right: Photo Grid */}
          <div className="lg:col-span-8">
            {files.length === 0 ? (
              <div className="h-full min-h-80 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <FileArchive className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Photos Uploaded</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Upload up to 50 photos, select a spec, process them all at once, and download as a ZIP file.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">
                    {files.length} Photos
                    {doneCount > 0 && (
                      <span className="ml-2 text-emerald-400">• {doneCount} processed</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="ml-2 text-slate-500">• {pendingCount} pending</span>
                    )}
                  </h2>
                  {/* Progress bar */}
                  {(isProcessing || doneCount > 0) && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${files.length > 0 ? (doneCount / files.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {Math.round(files.length > 0 ? (doneCount / files.length) * 100 : 0)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto custom-scroll pr-1">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#0a1628] aspect-[3/4]"
                    >
                      {/* Preview: processed if done, original otherwise */}
                      <img
                        src={f.status === "done" && f.dataUrl ? f.dataUrl : URL.createObjectURL(f.file)}
                        alt={f.file.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Status overlay */}
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all",
                        f.status === "processing" ? "bg-black/50" :
                        f.status === "done" ? "bg-black/0 group-hover:bg-black/50" :
                        f.status === "error" ? "bg-red-900/40" : "bg-black/0 group-hover:bg-black/40"
                      )}>
                        {f.status === "processing" && (
                          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                        )}
                        {f.status === "done" && (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {f.status === "error" && (
                          <span className="text-xs text-red-400 px-1 text-center">Failed</span>
                        )}
                      </div>

                      {/* Done indicator */}
                      {f.status === "done" && (
                        <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(f.id)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Download individual */}
                      {f.status === "done" && f.dataUrl && (
                        <button
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = f.dataUrl!;
                            a.download = `${selectedSpec.id}-${f.file.name}`;
                            a.click();
                          }}
                          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-cyan-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-cyan-500"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* File name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{f.file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
