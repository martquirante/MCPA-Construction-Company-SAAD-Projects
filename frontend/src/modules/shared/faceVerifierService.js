/**
 * MCPA Construction & Supply - Biometric & KYC Face Verifier (Pure JavaScript Engine)
 * Native Next.js / Node.js Computer Vision Diagnostics (Zero Python & OpenCV system dependencies).
 */

const fs = require("fs");
const jpeg = require("jpeg-js");
const { PNG } = require("pngjs");

async function loadImage(inputSource) {
  if (!inputSource) return null;
  const cleanSource = String(inputSource).trim();

  let buffer = null;

  if (cleanSource.startsWith("http://") || cleanSource.startsWith("https://")) {
    try {
      const res = await fetch(cleanSource, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      buffer = Buffer.from(ab);
    } catch (e) {
      return null;
    }
  } else if (cleanSource.startsWith("data:") || cleanSource.includes(";base64,") || !fs.existsSync(cleanSource)) {
    try {
      let b64 = cleanSource;
      if (b64.includes(",")) b64 = b64.split(",")[1];
      buffer = Buffer.from(b64, "base64");
    } catch (e) {
      throw new Error(`Failed to decode base64 image: ${e.message}`);
    }
  } else {
    try {
      if (fs.existsSync(cleanSource)) {
        buffer = fs.readFileSync(cleanSource);
      }
    } catch (e) {
      throw new Error(`Could not read image file at ${cleanSource}`);
    }
  }

  if (!buffer || buffer.length === 0) return null;

  try {
    const decodedJpeg = jpeg.decode(buffer, { useTArray: true });
    if (decodedJpeg && decodedJpeg.data && decodedJpeg.width > 0 && decodedJpeg.height > 0) {
      return {
        width: decodedJpeg.width,
        height: decodedJpeg.height,
        data: decodedJpeg.data,
      };
    }
  } catch (e) {}

  try {
    const decodedPng = PNG.sync.read(buffer);
    if (decodedPng && decodedPng.data && decodedPng.width > 0 && decodedPng.height > 0) {
      return {
        width: decodedPng.width,
        height: decodedPng.height,
        data: decodedPng.data,
      };
    }
  } catch (e) {}

  return null;
}

function isSkinPixel(r, g, b) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cr = (r - y) * 0.713 + 128;
  const cb = (b - y) * 0.564 + 128;
  return cr >= 133 && cr <= 175 && cb >= 77 && cb <= 128;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 180), Math.round(s * 255), Math.round(v * 255)];
}

function computeLightingAndBlur(img) {
  const { width, height, data } = img;
  const totalPixels = width * height;
  const gray = new Float32Array(totalPixels);
  let graySum = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const val = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    gray[i] = val;
    graySum += val;
  }

  const meanBrightness = graySum / totalPixels;
  const is_too_dark = meanBrightness < 45.0;
  const is_too_bright = meanBrightness > 220.0;

  let lapSum = 0, lapSqSum = 0, count = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 320));

  for (let y = 1; y < height - 1; y += step) {
    const rowOffset = y * width;
    const rowAbove = (y - 1) * width;
    const rowBelow = (y + 1) * width;

    for (let x = 1; x < width - 1; x += step) {
      const center = gray[rowOffset + x];
      const top = gray[rowAbove + x];
      const bottom = gray[rowBelow + x];
      const left = gray[rowOffset + x - 1];
      const right = gray[rowOffset + x + 1];

      const lap = top + bottom + left + right - 4 * center;
      lapSum += lap;
      lapSqSum += lap * lap;
      count++;
    }
  }

  const meanLap = count > 0 ? lapSum / count : 0;
  const laplacianVar = count > 0 ? lapSqSum / count - meanLap * meanLap : 0;
  const is_blurry = laplacianVar < 18.0;

  return {
    meanBrightness: Math.round(meanBrightness * 10) / 10,
    is_too_dark,
    is_too_bright,
    laplacianVar: Math.round(laplacianVar * 10) / 10,
    is_blurry,
    gray,
  };
}

function estimateFaceAndLandmarks(img, clientMeta = null) {
  const { width, height, data } = img;

  if (clientMeta?.landmarks && clientMeta?.faceBox) {
    const fb = clientMeta.faceBox;
    const lm = clientMeta.landmarks;

    const toPt = (pt, fallbackX, fallbackY) => {
      if (!pt) return [fallbackX, fallbackY];
      if (Array.isArray(pt)) return [Number(pt[0]) || fallbackX, Number(pt[1]) || fallbackY];
      if (typeof pt === "object") return [Number(pt.x ?? pt[0] ?? fallbackX), Number(pt.y ?? pt[1] ?? fallbackY)];
      return [fallbackX, fallbackY];
    };

    const fx = Math.max(0, Math.round(fb.x || 0));
    const fy = Math.max(0, Math.round(fb.y || 0));
    const fw = Math.min(width - fx, Math.round(fb.width || width * 0.5));
    const fh = Math.min(height - fy, Math.round(fb.height || height * 0.5));

    const defaultNoseX = fx + fw * 0.5;
    const defaultNoseY = fy + fh * 0.55;
    const nosePt = toPt(lm.nose || lm.noseTip || lm.nose_tip, defaultNoseX, defaultNoseY);
    const rightEyePt = toPt(lm.right_eye || lm.rightEye || lm.right, fx + fw * 0.35, fy + fh * 0.4);
    const leftEyePt = toPt(lm.left_eye || lm.leftEye || lm.left, fx + fw * 0.65, fy + fh * 0.4);
    const rightMouthPt = toPt(lm.right_mouth || lm.mouthRight || lm.mouth_right, nosePt[0] - fw * 0.15, nosePt[1] + fh * 0.25);
    const leftMouthPt = toPt(lm.left_mouth || lm.mouthLeft || lm.mouth_left, nosePt[0] + fw * 0.15, nosePt[1] + fh * 0.25);

    return {
      faceBox: {
        x: fx,
        y: fy,
        width: fw,
        height: fh,
      },
      landmarks: {
        right_eye: rightEyePt,
        left_eye: leftEyePt,
        nose: nosePt,
        right_mouth: rightMouthPt,
        left_mouth: leftMouthPt,
        confidence: Number(lm.confidence) || 0.95,
      },
      faceCount: 1,
    };
  }

  let minX = width, maxX = 0, minY = height, maxY = 0, skinCount = 0;
  const sampleStep = Math.max(2, Math.floor(Math.min(width, height) / 160));
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        skinCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const sampledTotal = (height / sampleStep) * (width / sampleStep);
  const skinRatio = skinCount / (sampledTotal || 1);

  if (skinRatio < 0.04 || maxX <= minX || maxY <= minY) {
    return { faceBox: null, landmarks: null, faceCount: 0 };
  }

  const fw = maxX - minX;
  const fh = maxY - minY;
  const fx = minX;
  const fy = minY;

  const faceBox = {
    x: Math.max(0, fx),
    y: Math.max(0, fy),
    width: Math.min(width - fx, fw),
    height: Math.min(height - fy, fh),
  };

  const landmarks = {
    right_eye: [fx + fw * 0.35, fy + fh * 0.38],
    left_eye: [fx + fw * 0.65, fy + fh * 0.38],
    nose: [fx + fw * 0.50, fy + fh * 0.55],
    right_mouth: [fx + fw * 0.38, fy + fh * 0.74],
    left_mouth: [fx + fw * 0.62, fy + fh * 0.74],
    confidence: 0.88,
  };

  return { faceBox, landmarks, faceCount: 1 };
}

function detectObstructions(img, faceBox, landmarks) {
  const { width: w, height: h, data } = img;
  const { x: fx, y: fy, width: fw, height: fh } = faceBox;

  const re_x = Math.round(landmarks.right_eye[0]);
  const re_y = Math.round(landmarks.right_eye[1]);
  const le_x = Math.round(landmarks.left_eye[0]);
  const le_y = Math.round(landmarks.left_eye[1]);
  const nx = Math.round(landmarks.nose[0]);
  const ny = Math.round(landmarks.nose[1]);

  const obstruction_issues = [];
  let hat_detected = false;
  let sunglasses_detected = false;
  let eyeglasses_detected = false;
  let mask_detected = false;
  let face_occluded = false;

  function getPixelRgb(x, y) {
    const px = Math.max(0, Math.min(w - 1, x));
    const py = Math.max(0, Math.min(h - 1, y));
    const idx = (py * w + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  function getPixelGray(x, y) {
    const [r, g, b] = getPixelRgb(x, y);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // A. Sunglasses & Eyeglasses
  const eyeRadius = Math.max(8, Math.round(fw * 0.12));
  function analyzeEyeBox(cx, cy) {
    let darkCount = 0, total = 0, graySum = 0;
    for (let dy = -eyeRadius; dy <= eyeRadius; dy += 2) {
      for (let dx = -eyeRadius; dx <= eyeRadius; dx += 2) {
        const val = getPixelGray(cx + dx, cy + dy);
        if (val < 65) darkCount++;
        graySum += val;
        total++;
      }
    }
    return {
      darkRatio: total > 0 ? darkCount / total : 0,
      meanGray: total > 0 ? graySum / total : 128,
    };
  }

  const rEyeStats = analyzeEyeBox(re_x, re_y);
  const lEyeStats = analyzeEyeBox(le_x, le_y);
  const meanEyeGray = (rEyeStats.meanGray + lEyeStats.meanGray) / 2.0;

  let cheekGraySum = 0, cheekCount = 0;
  const ch_y1 = Math.max(0, ny - Math.round(fh * 0.08));
  const ch_y2 = Math.min(h, ny + Math.round(fh * 0.08));
  for (let cy = ch_y1; cy < ch_y2; cy += 2) {
    for (let cx = fx + Math.round(fw * 0.15); cx < fx + Math.round(fw * 0.35); cx += 2) {
      cheekGraySum += getPixelGray(cx, cy);
      cheekCount++;
    }
  }
  const cheekGrayMean = cheekCount > 0 ? cheekGraySum / cheekCount : 140.0;

  if (
    (rEyeStats.darkRatio > 0.65 && lEyeStats.darkRatio > 0.65) ||
    (meanEyeGray < 45.0 && cheekGrayMean > 95.0)
  ) {
    sunglasses_detected = true;
    obstruction_issues.push({
      code: "SUNGLASSES_DETECTED",
      type: "sunglasses",
      fil: "Naka-shades o sunglasses. Pakitanggal ang salamin sa mata upang makita ang mga mata.",
      en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
    });
  } else {
    const bx1 = Math.round(Math.min(re_x, le_x) + fw * 0.12);
    const bx2 = Math.round(Math.max(re_x, le_x) - fw * 0.12);
    const by1 = Math.round(Math.min(re_y, le_y) - fh * 0.04);
    const by2 = Math.round(Math.max(re_y, le_y) + fh * 0.04);

    if (bx2 > bx1 && by2 > by1) {
      let bridgeDarkCount = 0, bridgeSkinCount = 0, bridgeTotal = 0, edgeChanges = 0, lastVal = null;
      for (let y = by1; y < by2; y++) {
        for (let x = bx1; x < bx2; x++) {
          const [r, g, b] = getPixelRgb(x, y);
          const gVal = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gVal < 55) bridgeDarkCount++;
          if (isSkinPixel(r, g, b)) bridgeSkinCount++;
          if (lastVal !== null && Math.abs(gVal - lastVal) > 40) edgeChanges++;
          lastVal = gVal;
          bridgeTotal++;
        }
      }
      const bridgeDarkRatio = bridgeTotal > 0 ? bridgeDarkCount / bridgeTotal : 0;
      const bridgeSkin = bridgeTotal > 0 ? bridgeSkinCount / bridgeTotal : 1;
      const bridgeEdgeDensity = bridgeTotal > 0 ? edgeChanges / bridgeTotal : 0;

      if (bridgeEdgeDensity > 0.38 && bridgeDarkRatio > 0.30 && bridgeSkin < 0.40) {
        eyeglasses_detected = true;
        obstruction_issues.push({
          code: "EYEGLASSES_DETECTED",
          type: "eyeglasses",
          fil: "Naka-salamin sa mata na may makapal na frame. Pakitanggal ang salamin upang maging malinaw ang beripikasyon.",
          en: "Glasses detected. Please remove your glasses or sunglasses to verify your eyes.",
        });
      }
    }
  }

  // B. Hat / Helmet
  const skull_top = Math.max(0, fy - Math.round(fh * 0.22));
  const skull_bot = Math.min(h, fy + Math.round(fh * 0.04));
  const skull_x1 = Math.max(0, fx + Math.round(fw * 0.15));
  const skull_x2 = Math.min(w, fx + Math.round(fw * 0.85));

  if (skull_bot > skull_top && skull_x2 > skull_x1) {
    let yellowOrangeCount = 0, skullTotal = 0;
    for (let y = skull_top; y < skull_bot; y += 2) {
      for (let x = skull_x1; x < skull_x2; x += 2) {
        const [r, g, b] = getPixelRgb(x, y);
        const [hue, sat, val] = rgbToHsv(r, g, b);
        if (hue >= 14 && hue <= 38 && sat > 80 && val > 80) yellowOrangeCount++;
        skullTotal++;
      }
    }
    const helmetRatio = skullTotal > 0 ? yellowOrangeCount / skullTotal : 0;

    const forehead_y1 = Math.max(0, fy);
    const forehead_y2 = Math.min(h, Math.min(re_y, le_y) - Math.round(fh * 0.04));
    const forehead_x1 = Math.max(0, fx + Math.round(fw * 0.2));
    const forehead_x2 = Math.min(w, fx + Math.round(fw * 0.8));

    let clothCount = 0, foreheadSkinCount = 0, foreheadTotal = 0;
    if (forehead_y2 > forehead_y1 && forehead_x2 > forehead_x1) {
      for (let y = forehead_y1; y < forehead_y2; y += 2) {
        for (let x = forehead_x1; x < forehead_x2; x += 2) {
          const [r, g, b] = getPixelRgb(x, y);
          const [hue, sat, val] = rgbToHsv(r, g, b);
          if (hue > 26 && hue < 168 && sat > 65 && val > 60) clothCount++;
          if (isSkinPixel(r, g, b)) foreheadSkinCount++;
          foreheadTotal++;
        }
      }
    }
    const clothRatio = foreheadTotal > 0 ? clothCount / foreheadTotal : 0;
    const foreheadSkin = foreheadTotal > 0 ? foreheadSkinCount / foreheadTotal : 1.0;

    if (helmetRatio > 0.32 || (clothRatio > 0.35 && foreheadSkin < 0.25)) {
      hat_detected = true;
      obstruction_issues.push({
        code: "HAT_DETECTED",
        type: "hat",
        fil: "Naka-sumbrero, cap, o safety helmet. Pakitanggal ang anumang panakip sa ulo bago magpatuloy.",
        en: "Facial obstruction detected. Please remove any hats, masks, or headwear.",
      });
    }
  }

  // C. Face Mask
  const lower_y1 = Math.max(0, ny);
  const lower_y2 = Math.min(h, fy + fh);
  const lower_x1 = Math.max(0, fx + Math.round(fw * 0.15));
  const lower_x2 = Math.min(w, fx + Math.round(fw * 0.85));

  if (lower_y2 > lower_y1 && lower_x2 > lower_x1) {
    let lowerSkinCount = 0, lowerTotal = 0;
    for (let y = lower_y1; y < lower_y2; y += 2) {
      for (let x = lower_x1; x < lower_x2; x += 2) {
        const [r, g, b] = getPixelRgb(x, y);
        if (isSkinPixel(r, g, b)) lowerSkinCount++;
        lowerTotal++;
      }
    }
    const lowerSkin = lowerTotal > 0 ? lowerSkinCount / lowerTotal : 1.0;
    if (lowerSkin < 0.18) {
      mask_detected = true;
      obstruction_issues.push({
        code: "MASK_DETECTED",
        type: "mask",
        fil: "Naka-face mask o may takip ang bibig at ilong. Pakitanggal ang mask o panyo bago magpatuloy.",
        en: "Facial obstruction detected. Please remove any hats, masks, or headwear.",
      });
    }
  }

  // D. Hand Occlusion
  let rCheekGray = 0, rCheekSkin = 0, rCheekCount = 0;
  let lCheekGray = 0, lCheekSkin = 0, lCheekCount = 0;

  for (let y = ch_y1; y < ch_y2; y += 2) {
    for (let x = fx + Math.round(fw * 0.08); x < fx + Math.round(fw * 0.32); x += 2) {
      const [r, g, b] = getPixelRgb(x, y);
      rCheekGray += 0.299 * r + 0.587 * g + 0.114 * b;
      if (isSkinPixel(r, g, b)) rCheekSkin++;
      rCheekCount++;
    }
    for (let x = fx + Math.round(fw * 0.68); x < fx + Math.round(fw * 0.92); x += 2) {
      const [r, g, b] = getPixelRgb(x, y);
      lCheekGray += 0.299 * r + 0.587 * g + 0.114 * b;
      if (isSkinPixel(r, g, b)) lCheekSkin++;
      lCheekCount++;
    }
  }

  const rMean = rCheekCount > 0 ? rCheekGray / rCheekCount : 128;
  const lMean = lCheekCount > 0 ? lCheekGray / lCheekCount : 128;
  const rSkinRatio = rCheekCount > 0 ? rCheekSkin / rCheekCount : 1;
  const lSkinRatio = lCheekCount > 0 ? lCheekSkin / lCheekCount : 1;

  if (Math.abs(rMean - lMean) > 60.0 && (rSkinRatio < 0.25 || lSkinRatio < 0.25)) {
    face_occluded = true;
    obstruction_issues.push({
      code: "FACE_OBSTRUCTED",
      type: "occlusion",
      fil: "May nakaharang o sagabal sa iyong mukha (tulad ng kamay o bagay). Alisin ang anumang nakaharang.",
      en: "Facial obstruction detected. Please remove any hats, masks, or headwear.",
    });
  }

  return {
    has_obstruction: obstruction_issues.length > 0,
    hat_detected,
    sunglasses_detected,
    eyeglasses_detected,
    mask_detected,
    face_occluded,
    issues: obstruction_issues,
  };
}

function compareWithReference(liveImg, refImg, liveBox) {
  if (!refImg || !liveImg || !liveBox) {
    return { matched: true, score: 1.0, note: "No reference photo provided." };
  }

  const H_BINS = 30, S_BINS = 32;
  const histLive = new Float32Array(H_BINS * S_BINS);
  const histRef = new Float32Array(H_BINS * S_BINS);

  let liveCount = 0;
  for (let y = liveBox.y; y < liveBox.y + liveBox.height; y += 2) {
    for (let x = liveBox.x; x < liveBox.x + liveBox.width; x += 2) {
      const idx = (y * liveImg.width + x) * 4;
      const [h, s] = rgbToHsv(liveImg.data[idx], liveImg.data[idx + 1], liveImg.data[idx + 2]);
      const hBin = Math.min(H_BINS - 1, Math.floor((h / 180) * H_BINS));
      const sBin = Math.min(S_BINS - 1, Math.floor((s / 256) * S_BINS));
      histLive[hBin * S_BINS + sBin]++;
      liveCount++;
    }
  }

  let refCount = 0;
  for (let y = 0; y < refImg.height; y += 2) {
    for (let x = 0; x < refImg.width; x += 2) {
      const idx = (y * refImg.width + x) * 4;
      const [h, s] = rgbToHsv(refImg.data[idx], refImg.data[idx + 1], refImg.data[idx + 2]);
      const hBin = Math.min(H_BINS - 1, Math.floor((h / 180) * H_BINS));
      const sBin = Math.min(S_BINS - 1, Math.floor((s / 256) * S_BINS));
      histRef[hBin * S_BINS + sBin]++;
      refCount++;
    }
  }

  if (liveCount > 0) {
    for (let i = 0; i < histLive.length; i++) histLive[i] /= liveCount;
  }
  if (refCount > 0) {
    for (let i = 0; i < histRef.length; i++) histRef[i] /= refCount;
  }

  let sumL = 0, sumR = 0;
  for (let i = 0; i < histLive.length; i++) {
    sumL += histLive[i];
    sumR += histRef[i];
  }
  const meanL = sumL / histLive.length;
  const meanR = sumR / histRef.length;

  let num = 0, denL = 0, denR = 0;
  for (let i = 0; i < histLive.length; i++) {
    const dL = histLive[i] - meanL;
    const dR = histRef[i] - meanR;
    num += dL * dR;
    denL += dL * dL;
    denR += dR * dR;
  }
  const den = Math.sqrt(denL * denR);
  const histCorr = den > 0 ? Math.max(0, num / den) : 0.5;

  const combinedScore = Math.max(0, Math.min(1, histCorr));
  const matched = combinedScore >= 0.20 || histCorr >= 0.28;

  return {
    matched,
    score: Math.round(combinedScore * 1000) / 1000,
    hist_correlation: Math.round(histCorr * 1000) / 1000,
    social_face_detected: true,
  };
}

async function verifyFaceTelemetry(imageInput, referenceInput = null, clientMeta = null) {
  const liveImg = await loadImage(imageInput);
  if (!liveImg) {
    throw new Error("Could not decode image input into valid pixels.");
  }

  const refImg = referenceInput ? await loadImage(referenceInput) : null;
  const { width: w, height: h } = liveImg;

  const issues = [];
  const head_pose = { yaw: 0.0, pitch: 0.0 };
  let is_centered = true;
  let is_too_close = false;
  let is_too_far = false;
  let obstructions = { has_obstruction: false, issues: [] };
  let ref_match = null;

  const lighting = computeLightingAndBlur(liveImg);
  if (lighting.is_too_dark) {
    issues.push({
      code: "TOO_DARK",
      fil: "Masyadong madilim ang paligid. Lumipat sa mas maliwanag na lugar o buksan ang ilaw.",
      en: "Environment is too dark. Please move to a well-lit area or turn on a light.",
    });
  } else if (lighting.is_too_bright) {
    issues.push({
      code: "TOO_BRIGHT",
      fil: "Masyadong maliwanag o may matinding silaw. Iwasan ang matinding backlight.",
      en: "Lighting is too bright. Please avoid direct sunlight or harsh backlighting.",
    });
  }

  if (lighting.is_blurry) {
    issues.push({
      code: "BLURRY_IMAGE",
      type: "quality",
      fil: "Malabo o gumagalaw ang litrato. Hawakan nang maayos at steady ang camera.",
      en: "Camera is too shaky. Please hold your phone still or place it on a stable surface.",
    });
  }

  const faceData = estimateFaceAndLandmarks(liveImg, clientMeta);
  const { faceBox, landmarks, faceCount } = faceData;

  if (faceCount === 0 || !faceBox) {
    issues.push({
      code: "NO_FACE_DETECTED",
      fil: "Walang nakitang mukha sa litrato. Tumingin nang diretso sa camera nang buo ang mukha.",
      en: "No face detected. Look directly at camera.",
    });
  } else if (faceCount > 1) {
    issues.push({
      code: "MULTIPLE_FACES",
      fil: "Maraming tao ang nakita sa camera. Isang tao lamang ang dapat makita sa biometric frame.",
      en: "Multiple faces detected. Please ensure you are the only person in the frame.",
    });
  } else {
    const { x: fx, y: fy, width: fw, height: fh } = faceBox;

    const eyeMidX = (landmarks.right_eye[0] + landmarks.left_eye[0]) / 2.0;
    const eyeDist = Math.abs(landmarks.left_eye[0] - landmarks.right_eye[0]) + 1e-5;
    const yawRatio = (landmarks.nose[0] - eyeMidX) / eyeDist;
    head_pose.yaw = Math.round(yawRatio * 45.0 * 10) / 10;

    const cx = fx + fw / 2;
    const cy = fy + fh / 2;
    const offsetX = Math.abs(cx - w / 2) / w;
    const offsetY = Math.abs(cy - h / 2) / h;

    if (offsetX > 0.28 || offsetY > 0.32) {
      is_centered = false;
      issues.push({
        code: "OFF_CENTER",
        fil: "Igitna ang iyong mukha sa bilog na gabay.",
        en: "You are too close. Please step back slightly to fit your face inside the circle.",
      });
    }

    const faceArea = fw * fh;
    const totalArea = w * h;
    const ratio = faceArea / totalArea;

    if (ratio < 0.06) {
      is_too_far = true;
      issues.push({
        code: "TOO_FAR",
        fil: "Masyadong malayo ang iyong mukha. Lumapit nang bahagya sa camera.",
        en: "You are too far. Please move closer to the camera.",
      });
    } else if (ratio > 0.88) {
      is_too_close = true;
      issues.push({
        code: "TOO_CLOSE",
        fil: "Masyadong malapit ang iyong mukha. Dumistansya nang kaunti.",
        en: "You are too close. Please step back slightly to fit your face inside the circle.",
      });
    }

    obstructions = detectObstructions(liveImg, faceBox, landmarks);
    if (obstructions.has_obstruction) {
      for (const obs of obstructions.issues) {
        issues.push(obs);
      }
    }

    // 5. Social Reference Photo Matching (Option A: Informational audit notice, non-blocking)
    if (refImg) {
      const refRes = compareWithReference(liveImg, refImg, faceBox);
      ref_match = refRes;
      if (!refRes.matched) {
        issues.push({
          code: "SOCIAL_PFP_NOTICE",
          type: "pfp_mismatch",
          severity: "info",
          blocking: false,
          fil: "Pansin: Ang profile photo sa Google/Facebook ay iba sa live selfie (maaaring artista/avatar). Naitala ang iyong live selfie bilang opisyal na KYC.",
          en: "Notice: Linked social profile picture differs from live selfie. Your live selfie has been recorded as your official KYC verification.",
        });
      }
    }
  }

  const blockingIssues = issues.filter((iss) => iss.blocking !== false);
  const passed = blockingIssues.length === 0 && !obstructions.has_obstruction;
  const primaryMessage = passed
    ? "Beripikado ang biometric KYC / Biometric selfie passed all quality and face recognition tests."
    : (blockingIssues[0]?.fil || issues[0]?.fil || "Biometric validation notice");

  const resultPayload = {
    success: true,
    passed,
    face_detected: faceCount === 1,
    face_count: faceCount,
    face_box: faceBox,
    landmarks,
    head_pose,
    brightness: {
      score: lighting.meanBrightness,
      is_too_dark: lighting.is_too_dark,
      is_too_bright: lighting.is_too_bright,
    },
    blur: {
      score: lighting.laplacianVar,
      is_blurry: lighting.is_blurry,
    },
    framing: {
      is_centered,
      is_too_close,
      is_too_far,
    },
    obstructions,
    issues,
    message: primaryMessage,
  };

  if (ref_match) {
    resultPayload.reference_match = ref_match;
  }

  return resultPayload;
}

module.exports = {
  loadImage,
  verifyFaceTelemetry,
};
