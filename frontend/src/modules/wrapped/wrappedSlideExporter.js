/**
 * High-DPI HTML5 Canvas Exporter for 9:16 (1080x1920) Instagram Story Cards
 * ---------------------------------------------------------------------------
 * Paints the exact scene primitives from wrappedScenes.js onto a 1080x1920
 * canvas, guaranteeing crisp typography, architectural hairlines, and
 * aspect-ratio-preserved (object-cover) photos in both Light and Dark themes.
 */

import { STORY_W, STORY_H, resolveFonts, ensureFonts } from "./wrappedScenes";

/**
 * Preload an image with CORS anonymous, falling back to /api/wrapped-image-proxy
 * if remote storage blocks cross-origin requests.
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, 12000);

    img.onload = () => {
      if (timedOut) return;
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      if (timedOut) return;
      // Retry via safe backend proxy
      const proxyUrl = `/api/wrapped-image-proxy?url=${encodeURIComponent(url)}`;
      const retryImg = new window.Image();
      retryImg.crossOrigin = "anonymous";
      retryImg.onload = () => {
        clearTimeout(timer);
        resolve(retryImg);
      };
      retryImg.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      retryImg.src = proxyUrl;
    };

    img.src = url;
  });
}

/**
 * Draw image with object-cover aspect ratio scaling inside rect (x, y, w, h)
 */
function drawCoverImage(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    ctx.fillStyle = "rgba(128,128,128,0.15)";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const imgAspect = imgW / imgH;
  const targetAspect = w / h;

  let sx, sy, sw, sh;
  if (imgAspect > targetAspect) {
    sh = imgH;
    sw = sh * targetAspect;
    sx = (imgW - sw) / 2;
    sy = 0;
  } else {
    sw = imgW;
    sh = sw / targetAspect;
    sx = 0;
    sy = (imgH - sh) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawContainImage(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    return;
  }
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
}

/**
 * Renders a scene to an offscreen canvas at full 1080x1920 resolution.
 */
export async function renderSceneToCanvas(scene) {
  if (typeof window === "undefined") return null;

  const fonts = resolveFonts();
  await ensureFonts(fonts);

  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  // Background
  ctx.fillStyle = scene.bg || "#f8f7f5";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Preload all image assets used in this scene in parallel
  const imageItems = (scene.items || []).filter((it) => it.t === "image" && it.src);
  const loadedImagesMap = new Map();
  await Promise.all(
    imageItems.map(async (it) => {
      if (!loadedImagesMap.has(it.src)) {
        const loaded = await preloadImage(it.src);
        loadedImagesMap.set(it.src, loaded);
      }
    })
  );

  // Draw primitives in exact order
  for (const it of scene.items) {
    if (it.t === "rect") {
      if (it.fill) {
        ctx.fillStyle = it.fill;
        ctx.fillRect(it.x, it.y, it.w, it.h);
      }
      if (it.stroke) {
        ctx.lineWidth = it.sw || 1;
        ctx.strokeStyle = it.stroke;
        ctx.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1);
      }
    } else if (it.t === "line") {
      ctx.beginPath();
      ctx.lineWidth = it.w || 1;
      ctx.strokeStyle = it.color;
      ctx.moveTo(it.x1, it.y1);
      ctx.lineTo(it.x2, it.y2);
      ctx.stroke();
    } else if (it.t === "image") {
      const img = loadedImagesMap.get(it.src);
      if (it.fit === "contain") {
        drawContainImage(ctx, img, it.x, it.y, it.w, it.h);
      } else {
        drawCoverImage(ctx, img, it.x, it.y, it.w, it.h);
      }
    } else if (it.t === "text") {
      const fontFamily = it.font === "mono" ? fonts.mono : fonts.display;
      ctx.font = `${it.weight || 600} ${it.size}px ${fontFamily}`;
      ctx.fillStyle = it.color || "#09090b";
      ctx.textAlign = it.align || "left";
      ctx.textBaseline = "alphabetic";

      // If letter spacing is requested and supported by canvas context
      if (it.ls && "letterSpacing" in ctx) {
        ctx.letterSpacing = `${it.ls}px`;
      }
      ctx.fillText(it.text, it.x, it.y);
      if ("letterSpacing" in ctx) {
        ctx.letterSpacing = "0px";
      }
    }
  }

  return canvas;
}

/**
 * Converts canvas to PNG Blob
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
}

/**
 * Downloads the current slide as a crisp 1080x1920 PNG file.
 */
export async function downloadSlidePng(scene, filename = "mcpa-wrapped-slide.png") {
  const canvas = await renderSceneToCanvas(scene);
  if (!canvas) return false;
  const blob = await canvasToBlob(canvas);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

/**
 * Shares the slide directly to native apps (Instagram Stories, Messages, Photos)
 * via Web Share API Level 2 (files support), falling back to direct PNG download.
 */
export async function shareSlideToSocial(scene, {
  filename = "mcpa-story.png",
  title = "MCPA Project Wrapped",
  text = "My completed residence monograph by MCPA Construction",
} = {}) {
  const canvas = await renderSceneToCanvas(scene);
  if (!canvas) return { success: false, method: "failed" };
  const blob = await canvasToBlob(canvas);
  if (!blob) return { success: false, method: "failed" };

  const file = new File([blob], filename, { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return { success: true, method: "native-share" };
    } catch (err) {
      if (err.name === "AbortError") {
        return { success: false, method: "aborted" };
      }
      // fall back to download if user cancelled or error
    }
  }

  // Fallback: direct download
  await downloadSlidePng(scene, filename);
  return { success: true, method: "download-fallback" };
}
