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
