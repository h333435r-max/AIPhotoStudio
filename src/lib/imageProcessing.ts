import { PhotoSpec } from "@/types";

export function processImage(
  imgElement: HTMLImageElement,
  spec: PhotoSpec,
  bgColor: string = "#FFFFFF"
): string {
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, spec.width, spec.height);

  // Calculate fit dimensions (cover mode - fill the frame)
  const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
  const specAspect = spec.width / spec.height;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > specAspect) {
    // Image is wider than spec
    drawHeight = spec.height;
    drawWidth = spec.height * imgAspect;
    drawX = (spec.width - drawWidth) / 2;
    drawY = 0;
  } else {
    // Image is taller than spec
    drawWidth = spec.width;
    drawHeight = spec.width / imgAspect;
    drawX = 0;
    drawY = (spec.height - drawHeight) / 2;
  }

  ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function applyAdjustments(
  imgElement: HTMLImageElement,
  spec: PhotoSpec,
  bgColor: string,
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    rotation: number;
  }
): string {
  const tempCanvas = document.createElement("canvas");
  const srcW = imgElement.naturalWidth;
  const srcH = imgElement.naturalHeight;
  tempCanvas.width = srcW;
  tempCanvas.height = srcH;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Apply filters
  tempCtx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
  tempCtx.drawImage(imgElement, 0, 0);

  // Final canvas
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, spec.width, spec.height);

  const cropSrcX = adjustments.cropX * srcW;
  const cropSrcY = adjustments.cropY * srcH;
  const cropSrcW = adjustments.cropW * srcW;
  const cropSrcH = adjustments.cropH * srcH;

  ctx.save();
  ctx.translate(spec.width / 2, spec.height / 2);
  ctx.rotate((adjustments.rotation * Math.PI) / 180);

  const cropAspect = cropSrcW / cropSrcH;
  const specAspect = spec.width / spec.height;

  let drawWidth: number;
  let drawHeight: number;

  if (cropAspect > specAspect) {
    drawHeight = spec.height;
    drawWidth = spec.height * cropAspect;
  } else {
    drawWidth = spec.width;
    drawHeight = spec.width / cropAspect;
  }

  ctx.drawImage(
    tempCanvas,
    cropSrcX,
    cropSrcY,
    cropSrcW,
    cropSrcH,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function compressToTargetSize(dataUrl: string, targetKB: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let quality = 0.92;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const tryCompress = () => {
        const result = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = Math.round((result.length * 3) / 4 / 1024);
        if (sizeKB > targetKB && quality > 0.1) {
          quality -= 0.05;
          tryCompress();
        } else {
          resolve(result);
        }
      };
      tryCompress();
    };
    img.src = dataUrl;
  });
}

export function getImageSizeKB(dataUrl: string): number {
  return Math.round((dataUrl.length * 3) / 4 / 1024);
}

export function generatePDFSheet(
  dataUrl: string,
  copies: number,
  specName: string
): void {
  const win = window.open("", "_blank");
  if (!win) return;

  const cols = copies <= 2 ? 2 : copies <= 4 ? 2 : 3;
  const rows = Math.ceil(copies / cols);

  let photosHtml = "";
  for (let i = 0; i < copies; i++) {
    photosHtml += `<div class="photo-cell"><img src="${dataUrl}" alt="${specName}" /></div>`;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Photo Studio Pro - ${specName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; }
        .header { text-align: center; padding: 10px; font-size: 12px; color: #666; border-bottom: 1px solid #ddd; margin-bottom: 10px; }
        .photo-grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 8px; padding: 10px; justify-items: center; }
        .photo-cell { border: 1px dashed #ccc; }
        .photo-cell img { display: block; width: 100%; height: auto; }
        .footer { text-align: center; padding: 10px; font-size: 10px; color: #999; border-top: 1px solid #ddd; margin-top: 10px; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">AI Photo Studio Pro | ${specName} | ${copies} Photos</div>
      <div class="photo-grid">${photosHtml}</div>
      <div class="footer">Generated by AI Photo Studio Pro • Cut along dashed lines</div>
      <div class="no-print" style="text-align:center;margin:10px">
        <button onclick="window.print()" style="padding:8px 20px;background:#0ea5e9;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px">🖨️ Print / Save PDF</button>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
