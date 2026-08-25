import { useRef, useState, useCallback } from "react";
import { Upload, Camera, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoUploadProps {
  onImageLoad: (img: HTMLImageElement, file: File) => void;
  hasImage: boolean;
  onClear: () => void;
}

export default function PhotoUpload({ onImageLoad, hasImage, onClear }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (JPG, PNG, WEBP)");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        onImageLoad(img, file);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (hasImage) {
    return (
      <button
        onClick={onClear}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all duration-200"
      >
        <X className="w-4 h-4" />
        Remove Photo & Upload New
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          isDragging
            ? "border-cyan-400 bg-cyan-500/10 scale-105"
            : "border-white/20 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
              isDragging ? "bg-cyan-500/20" : "bg-white/10"
            )}
          >
            <Upload className={cn("w-8 h-8 transition-colors", isDragging ? "text-cyan-400" : "text-slate-400")} />
          </div>
          <div>
            <p className="text-white font-semibold text-base">
              {isDragging ? "Drop your photo here!" : "Upload Your Photo"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-slate-600 text-xs mt-1">
              JPG, PNG, WEBP • Max 20MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Camera Button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-200"
      >
        <Camera className="w-4 h-4 text-cyan-400" />
        Take Photo with Camera
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Sample Photo */}
      <button
        onClick={async () => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const file = new File([], "sample.jpg", { type: "image/jpeg" });
            onImageLoad(img, file);
          };
          img.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80";
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-200"
      >
        <Image className="w-4 h-4 text-violet-400" />
        Use Sample Photo (Demo)
      </button>
    </div>
  );
}
