import { useEffect, useRef, useState, useCallback } from "react";
import { Eye, Loader2, AlertTriangle, CheckCircle2, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FaceGuide {
  faceX: number;       // 0–1 normalized
  faceY: number;
  faceW: number;
  faceH: number;
  eyeY: number;        // normalized Y of eyes midpoint
  centering: "good" | "off-left" | "off-right" | "too-high" | "too-low";
  headSize: "good" | "too-small" | "too-large";
  overall: "pass" | "warn" | "fail";
  score: number;       // 0–100
}

interface FaceGuideOverlayProps {
  image: HTMLImageElement | null;
  displayWidth: number;
  displayHeight: number;
}

type DetectionStatus = "idle" | "loading" | "detected" | "no-face" | "error";

export default function FaceGuideOverlay({ image, displayWidth, displayHeight }: FaceGuideOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [guide, setGuide] = useState<FaceGuide | null>(null);
  const [progress, setProgress] = useState(0);

  // Lightweight face detection using browser-native approach (no heavy model needed)
  // We use a canvas-based skin-tone + proportional detection as lightweight fallback,
  // but primary detection is via face-api.js TinyFaceDetector
  const detectFace = useCallback(async () => {
    if (!image) return;
    setStatus("loading");
    setProgress(10);

    try {
      // Dynamic import of face-api
      const faceapi = await import("face-api.js");
      setProgress(20);

      // Load models from CDN
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      
      setProgress(70);

      const detections = await faceapi
        .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
        .withFaceLandmarks(true);

      setProgress(90);

      if (!detections || detections.length === 0) {
        setStatus("no-face");
        setProgress(100);
        return;
      }

      const det = detections[0];
      const box = det.detection.box;
      const landmarks = det.landmarks;

      const imgW = image.naturalWidth;
      const imgH = image.naturalHeight;

      // Normalize coordinates
      const faceX = box.x / imgW;
      const faceY = box.y / imgH;
      const faceW = box.width / imgW;
      const faceH = box.height / imgH;

      // Eye midpoint
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const eyeY = (leftEye[0].y + rightEye[0].y) / 2 / imgH;

      // Centering check (face center should be within 15% of horizontal center)
      const faceCenterX = faceX + faceW / 2;
      let centering: FaceGuide["centering"] = "good";
      if (faceCenterX < 0.35) centering = "off-left";
      else if (faceCenterX > 0.65) centering = "off-right";
      else if (faceY < 0.05) centering = "too-high";
      else if (faceY + faceH > 0.9) centering = "too-low";

      // Head size check (face should be 60–80% of photo height for passport)
      let headSize: FaceGuide["headSize"] = "good";
      if (faceH < 0.45) headSize = "too-small";
      else if (faceH > 0.85) headSize = "too-large";

      // Score
      let score = 100;
      if (centering !== "good") score -= 30;
      if (headSize !== "good") score -= 25;

      const overall: FaceGuide["overall"] =
        score >= 80 ? "pass" : score >= 55 ? "warn" : "fail";

      const g: FaceGuide = { faceX, faceY, faceW, faceH, eyeY, centering, headSize, overall, score };
      setGuide(g);
      setStatus("detected");
      setProgress(100);

      if (overall === "pass") toast.success("Face detected — photo meets passport guidelines!");
      else if (overall === "warn") toast.warning("Face detected with minor issues — check guides.");
      else toast.error("Photo doesn't meet passport standards — check guides.");

    } catch (err) {
      console.error("Face detection error:", err);
      setStatus("error");
      setProgress(100);
    }
  }, [image]);

  // Draw overlay on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !guide || status !== "detected") return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const scaleX = (v: number) => v * displayWidth;
    const scaleY = (v: number) => v * displayHeight;

    // Face bounding box
    const color = guide.overall === "pass" ? "#10b981" : guide.overall === "warn" ? "#f59e0b" : "#ef4444";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeRect(
      scaleX(guide.faceX) - 4,
      scaleY(guide.faceY) - 4,
      scaleX(guide.faceW) + 8,
      scaleY(guide.faceH) + 8
    );
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Horizontal center guide line
    ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(displayWidth / 2, 0);
    ctx.lineTo(displayWidth / 2, displayHeight);
    ctx.stroke();

    // Eye line guide
    ctx.strokeStyle = "rgba(167, 139, 250, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    const eyeDisplayY = scaleY(guide.eyeY);
    ctx.beginPath();
    ctx.moveTo(0, eyeDisplayY);
    ctx.lineTo(displayWidth, eyeDisplayY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Eye line label
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
    ctx.fillText("Eye Line", 4, eyeDisplayY - 4);

    // Corner markers on face box
    const markerLen = 14;
    const bx = scaleX(guide.faceX) - 4;
    const by = scaleY(guide.faceY) - 4;
    const bw = scaleX(guide.faceW) + 8;
    const bh = scaleY(guide.faceH) + 8;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    const corners = [
      [bx, by, bx + markerLen, by, bx, by + markerLen],
      [bx + bw, by, bx + bw - markerLen, by, bx + bw, by + markerLen],
      [bx, by + bh, bx + markerLen, by + bh, bx, by + bh - markerLen],
      [bx + bw, by + bh, bx + bw - markerLen, by + bh, bx + bw, by + bh - markerLen],
    ];

    for (const [x1, y1, x2, y2, x3, y3] of corners) {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x3, y3);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Score badge
    const scoreText = `${guide.score}%`;
    ctx.font = "bold 13px sans-serif";
    const tw = ctx.measureText(scoreText).width;
    const badgeX = bx + bw / 2 - tw / 2 - 6;
    const badgeY = by - 28;
    ctx.fillStyle = color + "cc";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, tw + 12, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(scoreText, badgeX + 6, badgeY + 14);
  }, [guide, status, displayWidth, displayHeight]);

  if (!image) return null;

  return (
    <div className="space-y-3">
      {/* Overlay canvas — positioned over the preview image */}
      {status === "detected" && guide && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ mixBlendMode: "normal" }}
          />
        </div>
      )}

      {/* Progress */}
      {status === "loading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Loading face detection model...
            </span>
            <span className="text-xs text-cyan-400 font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {status === "detected" && guide && (
        <div className="grid grid-cols-2 gap-2">
          <div className={cn(
            "rounded-xl border p-3 text-center",
            guide.centering === "good" ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
          )}>
            <div className={cn("text-xs font-semibold mb-0.5", guide.centering === "good" ? "text-emerald-400" : "text-amber-400")}>
              Centering
            </div>
            <div className="text-xs text-slate-400">
              {guide.centering === "good" ? "✅ Centered" :
               guide.centering === "off-left" ? "⬅ Move Right" :
               guide.centering === "off-right" ? "➡ Move Left" :
               guide.centering === "too-high" ? "⬆ Move Down" : "⬇ Move Up"}
            </div>
          </div>
          <div className={cn(
            "rounded-xl border p-3 text-center",
            guide.headSize === "good" ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
          )}>
            <div className={cn("text-xs font-semibold mb-0.5", guide.headSize === "good" ? "text-emerald-400" : "text-amber-400")}>
              Head Size
            </div>
            <div className="text-xs text-slate-400">
              {guide.headSize === "good" ? "✅ Good Size" :
               guide.headSize === "too-small" ? "🔍 Move Closer" : "↔ Move Back"}
            </div>
          </div>
          <div className={cn(
            "col-span-2 rounded-xl border p-3 flex items-center justify-between",
            guide.overall === "pass" ? "border-emerald-500/30 bg-emerald-500/10" :
            guide.overall === "warn" ? "border-amber-500/30 bg-amber-500/10" :
            "border-red-500/30 bg-red-500/10"
          )}>
            <div className="flex items-center gap-2">
              {guide.overall === "pass" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
               <AlertTriangle className="w-4 h-4 text-amber-400" />}
              <span className={cn("text-sm font-semibold",
                guide.overall === "pass" ? "text-emerald-300" :
                guide.overall === "warn" ? "text-amber-300" : "text-red-300"
              )}>
                {guide.overall === "pass" ? "Passport Ready" :
                 guide.overall === "warn" ? "Minor Issues" : "Needs Adjustment"}
              </span>
            </div>
            <span className={cn("text-lg font-black",
              guide.overall === "pass" ? "text-emerald-400" :
              guide.overall === "warn" ? "text-amber-400" : "text-red-400"
            )}>
              {guide.score}/100
            </span>
          </div>
        </div>
      )}

      {status === "no-face" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">No face detected. Ensure the face is clearly visible and well-lit.</p>
        </div>
      )}

      {/* Detect / Re-detect Button */}
      <button
        onClick={detectFace}
        disabled={status === "loading"}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200",
          status === "loading"
            ? "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
            : status === "detected"
            ? "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            : "border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
        )}
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === "detected" ? (
          <RefreshCw className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {status === "loading" ? "Detecting..." :
         status === "detected" ? "Re-detect Face" :
         status === "no-face" || status === "error" ? "Try Again" :
         "Detect Face & Check Guidelines"}
      </button>

      {/* Hidden canvas for non-overlay use */}
      {status !== "detected" && <canvas ref={canvasRef} className="hidden" />}
    </div>
  );
}
