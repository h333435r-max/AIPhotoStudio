import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, RotateCw, Lock, Unlock, Maximize2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CropRect {
  x: number; // 0–1 normalized
  y: number;
  w: number;
  h: number;
}

interface CropToolProps {
  image: HTMLImageElement;
  specAspect: number; // spec.width / spec.height
  cropRect: CropRect;
  rotation: number;
  onChange: (crop: CropRect) => void;
  onRotate: (deg: number) => void;
}

type Handle =
  | "tl" | "tc" | "tr"
  | "ml" | "mr"
  | "bl" | "bc" | "br"
  | "move";

const MIN_CROP = 0.08; // minimum crop size (normalized)
const HANDLE_RADIUS = 7;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function CropTool({
  image,
  specAspect,
  cropRect,
  rotation,
  onChange,
  onRotate,
}: CropToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [lockedAspect, setLockedAspect] = useState(true);

  // Drag state stored in ref to avoid stale closure in event listeners
  const dragState = useRef<{
    active: boolean;
    handle: Handle;
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setCanvasSize({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Convert normalized crop to canvas pixels
  const toCanvas = useCallback(
    (nRect: CropRect, cw: number, ch: number) => ({
      x: nRect.x * cw,
      y: nRect.y * ch,
      w: nRect.w * cw,
      h: nRect.h * ch,
    }),
    []
  );

  // Get handle hit areas (canvas coords)
  const getHandles = useCallback(
    (cx: number, cy: number, cw: number, ch: number) => ({
      tl: { x: cx, y: cy },
      tc: { x: cx + cw / 2, y: cy },
      tr: { x: cx + cw, y: cy },
      ml: { x: cx, y: cy + ch / 2 },
      mr: { x: cx + cw, y: cy + ch / 2 },
      bl: { x: cx, y: cy + ch },
      bc: { x: cx + cw / 2, y: cy + ch },
      br: { x: cx + cw, y: cy + ch },
    }),
    []
  );

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    const cw = canvasSize.w;
    const ch = canvasSize.h;

    // Draw source image scaled to canvas
    const imgAspect = image.naturalWidth / image.naturalHeight;
    let iw: number, ih: number, ix: number, iy: number;
    if (imgAspect > cw / ch) {
      iw = cw;
      ih = cw / imgAspect;
      ix = 0;
      iy = (ch - ih) / 2;
    } else {
      ih = ch;
      iw = ch * imgAspect;
      ix = (cw - iw) / 2;
      iy = 0;
    }
    ctx.drawImage(image, ix, iy, iw, ih);

    // Map normalized crop onto image display area
    const cropCx = ix + cropRect.x * iw;
    const cropCy = iy + cropRect.y * ih;
    const cropCw = cropRect.w * iw;
    const cropCh = cropRect.h * ih;

    // Darken outside crop region
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    // top strip
    ctx.fillRect(0, 0, cw, cropCy);
    // bottom strip
    ctx.fillRect(0, cropCy + cropCh, cw, ch - (cropCy + cropCh));
    // left strip
    ctx.fillRect(0, cropCy, cropCx, cropCh);
    // right strip
    ctx.fillRect(cropCx + cropCw, cropCy, cw - (cropCx + cropCw), cropCh);

    // Crop border
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cropCx, cropCy, cropCw, cropCh);

    // Rule-of-thirds grid inside crop
    ctx.strokeStyle = "rgba(6,182,212,0.25)";
    ctx.lineWidth = 0.75;
    ctx.setLineDash([3, 3]);
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cropCx + (cropCw / 3) * i, cropCy);
      ctx.lineTo(cropCx + (cropCw / 3) * i, cropCy + cropCh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropCx, cropCy + (cropCh / 3) * i);
      ctx.lineTo(cropCx + cropCw, cropCy + (cropCh / 3) * i);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Handles
    const handles = getHandles(cropCx, cropCy, cropCw, cropCh);
    for (const [, pt] of Object.entries(handles)) {
      // Outer shadow ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, HANDLE_RADIUS + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();
      // White fill
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      // Cyan ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Corner accent lines
    const cornerLen = 14;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2.5;
    const corners: [number, number, "tl" | "tr" | "bl" | "br"][] = [
      [cropCx, cropCy, "tl"],
      [cropCx + cropCw, cropCy, "tr"],
      [cropCx, cropCy + cropCh, "bl"],
      [cropCx + cropCw, cropCy + cropCh, "br"],
    ];
    for (const [cx2, cy2, corner] of corners) {
      const hDir = corner.includes("r") ? -1 : 1;
      const vDir = corner.includes("b") ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(cx2 + hDir * cornerLen, cy2);
      ctx.lineTo(cx2, cy2);
      ctx.lineTo(cx2, cy2 + vDir * cornerLen);
      ctx.stroke();
    }

    // Spec aspect ratio guide label
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "rgba(6,182,212,0.9)";
    const ratioLabel = lockedAspect ? `🔒 ${specAspect.toFixed(2)}:1 ratio` : "Free crop";
    ctx.fillText(ratioLabel, cropCx + 4, cropCy + 14);
  }, [canvasSize, cropRect, image, specAspect, lockedAspect, getHandles]);

  // Hit test: returns which handle (or "move") the pointer is closest to, or null
  const hitTest = useCallback(
    (px: number, py: number, cw: number, ch: number): Handle | null => {
      const imgAspect = image.naturalWidth / image.naturalHeight;
      let iw: number, ih: number, ix: number, iy: number;
      if (imgAspect > cw / ch) {
        iw = cw; ih = cw / imgAspect; ix = 0; iy = (ch - ih) / 2;
      } else {
        ih = ch; iw = ch * imgAspect; ix = (cw - iw) / 2; iy = 0;
      }
      const cropCx = ix + cropRect.x * iw;
      const cropCy = iy + cropRect.y * ih;
      const cropCw = cropRect.w * iw;
      const cropCh = cropRect.h * ih;

      const handles = getHandles(cropCx, cropCy, cropCw, cropCh);
      for (const [key, pt] of Object.entries(handles)) {
        const dist = Math.hypot(px - pt.x, py - pt.y);
        if (dist <= HANDLE_RADIUS + 6) return key as Handle;
      }
      // Inside crop box = move
      if (px >= cropCx && px <= cropCx + cropCw && py >= cropCy && py <= cropCy + cropCh) {
        return "move";
      }
      return null;
    },
    [cropRect, image, getHandles]
  );

  const getCanvasPoint = useCallback(
    (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX =
        "touches" in e ? e.touches[0]?.clientX ?? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0]?.clientY ?? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // Normalize canvas point back to image-relative 0–1
  const toNorm = useCallback(
    (px: number, py: number, cw: number, ch: number) => {
      const imgAspect = image.naturalWidth / image.naturalHeight;
      let iw: number, ih: number, ix: number, iy: number;
      if (imgAspect > cw / ch) {
        iw = cw; ih = cw / imgAspect; ix = 0; iy = (ch - ih) / 2;
      } else {
        ih = ch; iw = ch * imgAspect; ix = (cw - iw) / 2; iy = 0;
      }
      return { nx: (px - ix) / iw, ny: (py - iy) / ih };
    },
    [image]
  );

  // Pointer down
  const onPointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasPoint(e, canvas);
      const handle = hitTest(x, y, canvas.width, canvas.height);
      if (!handle) return;
      e.preventDefault();
      dragState.current = {
        active: true,
        handle,
        startX: x,
        startY: y,
        startCrop: { ...cropRect },
      };
    },
    [getCanvasPoint, hitTest, cropRect]
  );

  // Pointer move
  const onPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !dragState.current?.active) return;

      // Update cursor
      const { x: px, y: py } = getCanvasPoint(e, canvas);
      const h = hitTest(px, py, canvas.width, canvas.height);
      const cursors: Record<string, string> = {
        tl: "nw-resize", tc: "n-resize", tr: "ne-resize",
        ml: "w-resize", mr: "e-resize",
        bl: "sw-resize", bc: "s-resize", br: "se-resize",
        move: "move",
      };
      canvas.style.cursor = h ? cursors[h] ?? "crosshair" : "default";

      const { handle, startX, startY, startCrop } = dragState.current;
      const imgAspect = image.naturalWidth / image.naturalHeight;
      const cw = canvas.width;
      const ch = canvas.height;

      let iw: number, ih: number, ix: number, iy: number;
      if (imgAspect > cw / ch) {
        iw = cw; ih = cw / imgAspect; ix = 0; iy = (ch - ih) / 2;
      } else {
        ih = ch; iw = ch * imgAspect; ix = (cw - iw) / 2; iy = 0;
      }

      // Delta in normalized units
      const dx = (px - startX) / iw;
      const dy = (py - startY) / ih;

      let { x, y, w, h: height } = startCrop;

      if (handle === "move") {
        x = clamp(startCrop.x + dx, 0, 1 - startCrop.w);
        y = clamp(startCrop.y + dy, 0, 1 - startCrop.h);
      } else {
        // Resize handles
        if (handle.includes("l")) {
          const newX = clamp(startCrop.x + dx, 0, startCrop.x + startCrop.w - MIN_CROP);
          w = startCrop.w - (newX - startCrop.x);
          x = newX;
        }
        if (handle.includes("r")) {
          w = clamp(startCrop.w + dx, MIN_CROP, 1 - startCrop.x);
        }
        if (handle.includes("t")) {
          const newY = clamp(startCrop.y + dy, 0, startCrop.y + startCrop.h - MIN_CROP);
          height = startCrop.h - (newY - startCrop.y);
          y = newY;
        }
        if (handle.includes("b")) {
          height = clamp(startCrop.h + dy, MIN_CROP, 1 - startCrop.y);
        }
        if (handle === "tc" || handle === "bc") {
          // Vertical-only handles
          x = startCrop.x;
          w = startCrop.w;
        }
        if (handle === "ml" || handle === "mr") {
          // Horizontal-only handles
          y = startCrop.y;
          height = startCrop.h;
        }

        // Maintain aspect ratio if locked
        if (lockedAspect && handle !== "move" && handle !== "tc" && handle !== "bc" && handle !== "ml" && handle !== "mr") {
          // Use whichever dimension changed more
          const isHDriven = handle.includes("l") || handle.includes("r");
          if (isHDriven) {
            const newH = w / specAspect;
            if (handle.includes("t")) {
              y = (startCrop.y + startCrop.h) - newH;
              height = newH;
            } else {
              height = newH;
            }
          } else {
            const newW = height * specAspect;
            if (handle.includes("l")) {
              x = (startCrop.x + startCrop.w) - newW;
              w = newW;
            } else {
              w = newW;
            }
          }
          // Re-clamp after aspect lock
          x = clamp(x, 0, 1);
          y = clamp(y, 0, 1);
          w = clamp(w, MIN_CROP, 1 - x);
          height = clamp(height, MIN_CROP, 1 - y);
        }
      }

      onChange({ x, y, w, h: height });
      e.preventDefault();
    },
    [image, getCanvasPoint, hitTest, lockedAspect, specAspect, onChange]
  );

  // Pointer up
  const onPointerUp = useCallback(() => {
    if (dragState.current) dragState.current.active = false;
  }, []);

  // Attach listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("touchstart", onPointerDown, { passive: false });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    return () => {
      canvas.removeEventListener("mousedown", onPointerDown);
      canvas.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  // Cursor on hover (not dragging)
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || dragState.current?.active) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      const h = hitTest(px, py, canvas.width, canvas.height);
      const cursors: Record<string, string> = {
        tl: "nw-resize", tc: "n-resize", tr: "ne-resize",
        ml: "w-resize", mr: "e-resize",
        bl: "sw-resize", bc: "s-resize", br: "se-resize",
        move: "move",
      };
      canvas.style.cursor = h ? cursors[h] ?? "crosshair" : "crosshair";
    },
    [hitTest]
  );

  const resetCrop = () => {
    onChange({ x: 0, y: 0, w: 1, h: 1 });
  };

  const fitToSpec = () => {
    // Centre-crop to the spec aspect ratio
    const imgAspect = image.naturalWidth / image.naturalHeight;
    if (imgAspect > specAspect) {
      const newW = specAspect / imgAspect;
      onChange({ x: (1 - newW) / 2, y: 0, w: newW, h: 1 });
    } else {
      const newH = imgAspect / specAspect;
      onChange({ x: 0, y: (1 - newH) / 2, w: 1, h: newH });
    }
  };

  return (
    <div className="space-y-3">
      {/* Canvas crop area */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden bg-[#0a1628] border border-white/10 select-none"
        style={{ aspectRatio: `${image.naturalWidth} / ${image.naturalHeight}`, maxHeight: 320 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseMove={onMouseMove}
          style={{ cursor: "crosshair" }}
        />
      </div>

      {/* Crop info bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-xs font-mono text-slate-400">
        <span className="text-cyan-400">Crop</span>
        <span>x:{Math.round(cropRect.x * 100)}%</span>
        <span>y:{Math.round(cropRect.y * 100)}%</span>
        <span>w:{Math.round(cropRect.w * 100)}%</span>
        <span>h:{Math.round(cropRect.h * 100)}%</span>
        <span className={cn("ml-auto", lockedAspect ? "text-cyan-400" : "text-slate-500")}>
          {lockedAspect ? "🔒 locked" : "🔓 free"}
        </span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onRotate(-90)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          Rotate Left
        </button>
        <button
          onClick={() => onRotate(90)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          Rotate Right
        </button>

        <button
          onClick={() => setLockedAspect((v) => !v)}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-all",
            lockedAspect
              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
              : "border-white/15 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
          )}
        >
          {lockedAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {lockedAspect ? "Aspect Locked" : "Free Crop"}
        </button>

        <button
          onClick={fitToSpec}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          <Maximize2 className="w-4 h-4 text-violet-400" />
          Fit to Spec
        </button>
      </div>

      <button
        onClick={resetCrop}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-500 text-sm hover:text-slate-300 hover:bg-white/8 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Reset Crop
      </button>
    </div>
  );
}
