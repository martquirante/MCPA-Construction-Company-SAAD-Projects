/**
 * Client-side high-fidelity image compressor.
 * Downscales multi-megapixel camera / smartphone photos (e.g. 12MP/48MP)
 * to web-optimal dimensions (max 1920px) with high visual fidelity.
 * Dramatically reduces file size (from 5-10MB down to 250-400KB)
 * preventing HTTP 413 Payload Too Large errors and speeding up uploads.
 */
export async function compressImageFile(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.size < 200 * 1024) {
    return file;
  }

  // Skip SVG or animated GIF
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === "image/png";
        const outputType = isPng ? "image/png" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const ext = isPng ? ".png" : ".jpg";
              const cleanName = file.name.replace(/\.[^.]+$/, ext);
              const compressedFile = new File([blob], cleanName, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          outputType,
          isPng ? undefined : quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Automatically removes paper background from a photo/scan of a handwritten signature.
 * Converts paper pixels to transparent and normalizes ink strokes with smooth anti-aliasing.
 *
 * @param {File|Blob|string} source - Image File, Blob, or base64 Data URL of paper signature
 * @param {Object} [options]
 * @param {number} [options.threshold=195] - Brightness threshold (0-255).
 * @param {number} [options.smoothness=45] - Transition window for anti-aliasing.
 * @param {string} [options.targetColor="#0f172a"] - Hex color to normalize ink strokes
 * @param {boolean} [options.autoCrop=true] - Automatically crop to ink bounding box with padding.
 * @returns {Promise<{ dataUrl: string, width: number, height: number, strokePixelsCount: number }>}
 */
export async function extractPaperSignature(source, options = {}) {
  const {
    threshold = 195,
    smoothness = 45,
    targetColor = "#0f172a",
    autoCrop = true,
  } = options;

  if (!source) {
    throw new Error("No image source provided for background removal.");
  }

  // Convert File / Blob to Data URL if necessary
  let dataUrl = "";
  if (typeof source === "string") {
    dataUrl = source;
  } else if (source instanceof Blob || source instanceof File) {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Constrain max dimension to 1200px for speed and smoothness
        let w = img.width;
        let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Parse target color if not 'original'
        let targetR = 15;
        let targetG = 23;
        let targetB = 42;
        const isCustomColor = targetColor && targetColor !== "original" && targetColor.startsWith("#");
        if (isCustomColor) {
          const hex = targetColor.replace("#", "");
          if (hex.length === 6) {
            targetR = parseInt(hex.slice(0, 2), 16);
            targetG = parseInt(hex.slice(2, 4), 16);
            targetB = parseInt(hex.slice(4, 6), 16);
          }
        }

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let strokePixelsCount = 0;

        const lowerBound = Math.max(0, threshold - smoothness);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Relative luminance (ITU-R BT.601)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum >= threshold) {
            // Paper background: 100% transparent
            data[i + 3] = 0;
          } else if (lum <= lowerBound) {
            // Dark ink: 100% solid opacity
            data[i + 3] = 255;
            if (isCustomColor) {
              data[i] = targetR;
              data[i + 1] = targetG;
              data[i + 2] = targetB;
            }
            const pxIndex = i / 4;
            const x = pxIndex % w;
            const y = Math.floor(pxIndex / w);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            strokePixelsCount++;
          } else {
            // Transition edge / anti-aliasing
            const ratio = (threshold - lum) / smoothness;
            const alpha = Math.round(ratio * 255);
            data[i + 3] = alpha;
            if (isCustomColor) {
              data[i] = targetR;
              data[i + 1] = targetG;
              data[i + 2] = targetB;
            }
            if (alpha > 40) {
              const pxIndex = i / 4;
              const x = pxIndex % w;
              const y = Math.floor(pxIndex / w);
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              strokePixelsCount++;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Auto-crop if strokes found and autoCrop enabled
        if (autoCrop && strokePixelsCount > 20 && minX <= maxX && minY <= maxY) {
          const pad = 16;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
          const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext("2d");
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          resolve({
            dataUrl: cropCanvas.toDataURL("image/png"),
            width: cropW,
            height: cropH,
            strokePixelsCount,
          });
        } else {
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width: w,
            height: h,
            strokePixelsCount,
          });
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load signature image for background removal."));
    img.src = dataUrl;
  });
}

