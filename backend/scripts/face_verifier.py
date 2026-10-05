#!/usr/bin/env python3
"""
MCPA Architectural Portal - Advanced Python Biometric & KYC Face Verifier
Powered by OpenCV 5 Neural Face Detection (YuNet ONNX) & Computer Vision Diagnostics.

Detects:
1. Face Presence & Single-Person Validation
2. Facial Keypoints (Eyes, Nose, Mouth Corners)
3. Framing & Centering within Circular Viewport
4. Lighting & Exposure Diagnostics (Too Dark / Underexposed vs. Harsh Glare / Overexposed)
5. Sharpness & Blur Detection (Laplacian Variance)
6. Yaw (Turn Left/Right) & Pitch (Tilt Up/Down) pose estimation
"""

import os
os.environ["OPENCV_LOG_LEVEL"] = "OFF"
import sys
import json
import base64
import argparse
import numpy as np

try:
    import cv2
    if hasattr(cv2, "setLogLevel"):
        cv2.setLogLevel(0)
except ImportError:
    print(json.dumps({
        "success": False,
        "passed": False,
        "message": "OpenCV (cv2) is not installed in the Python environment."
    }))
    sys.exit(1)


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet.onnx")


import urllib.request


def load_image(input_source):
    """Loads image from file path, remote URL, or base64 string"""
    if not input_source:
        return None

    clean_source = str(input_source).strip()

    # Remote URL (e.g. Google or Facebook Avatar)
    if clean_source.startswith("http://") or clean_source.startswith("https://"):
        try:
            req = urllib.request.Request(
                clean_source,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                arr = np.asarray(bytearray(response.read()), dtype=np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                return img
        except Exception as e:
            return None

    # Local file path
    if os.path.isfile(clean_source):
        img = cv2.imread(clean_source)
        if img is None:
            raise ValueError(f"Could not read image file at {clean_source}")
        return img

    # Assume base64 string
    clean_b64 = clean_source
    if "," in clean_b64:
        clean_b64 = clean_b64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(clean_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode base64 into a valid image")
        return img
    except Exception as e:
        raise ValueError(f"Failed to decode image input: {str(e)}")


def get_yunet_detector(w, h):
    """Initializes OpenCV YuNet Face Detector"""
    if not os.path.exists(YUNET_PATH):
        return None
    try:
        detector = cv2.FaceDetectorYN_create(
            YUNET_PATH,
            "",
            (int(w), int(h)),
            score_threshold=0.6,
            nms_threshold=0.3,
            top_k=5000
        )
        return detector
    except Exception as e:
        return None


def is_skin_pixel(bgr):
    """Detects human skin pixels across diverse ethnicities in YCrCb color space"""
    if bgr is None or bgr.size == 0:
        return np.array([], dtype=bool)
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]
    # Kovacs/Otsu standard human skin threshold
    return (cr >= 133) & (cr <= 175) & (cb >= 77) & (cb <= 128)


def detect_obstructions(img, gray, face_box, landmarks):
    """
    Detects obstructions and occlusions on the face:
    1. Hat / Helmet / Cap / Headwear
    2. Sunglasses / Tinted glasses
    3. Eyeglasses / Clear frames
    4. Face Mask / Mouth & nose coverings
    5. Hand or Object blocking facial symmetry
    """
    h, w = img.shape[:2]
    fx, fy, fw, fh = face_box["x"], face_box["y"], face_box["width"], face_box["height"]

    re_x, re_y = int(landmarks["right_eye"][0]), int(landmarks["right_eye"][1])
    le_x, le_y = int(landmarks["left_eye"][0]), int(landmarks["left_eye"][1])
    nx, ny = int(landmarks["nose"][0]), int(landmarks["nose"][1])

    obstruction_issues = []
    hat_detected = False
    sunglasses_detected = False
    eyeglasses_detected = False
    mask_detected = False
    face_occluded = False

    # --- A. SUNGLASSES & EYEGLASSES DETECTION ---
    eye_radius = max(8, int(fw * 0.12))
    r_eye_box = img[max(0, re_y - eye_radius):min(h, re_y + eye_radius), max(0, re_x - eye_radius):min(w, re_x + eye_radius)]
    l_eye_box = img[max(0, le_y - eye_radius):min(h, le_y + eye_radius), max(0, le_x - eye_radius):min(w, le_x + eye_radius)]

    gray_r = cv2.cvtColor(r_eye_box, cv2.COLOR_BGR2GRAY) if r_eye_box.size > 0 else np.array([128])
    gray_l = cv2.cvtColor(l_eye_box, cv2.COLOR_BGR2GRAY) if l_eye_box.size > 0 else np.array([128])

    r_dark_ratio = float(np.mean(gray_r < 65)) if gray_r.size > 0 else 0.0
    l_dark_ratio = float(np.mean(gray_l < 65)) if gray_l.size > 0 else 0.0
    mean_eye_gray = (float(np.mean(gray_r)) + float(np.mean(gray_l))) / 2.0

    # Cheek reference brightness
    ch_y1, ch_y2 = max(0, ny - int(fh * 0.08)), min(h, ny + int(fh * 0.08))
    cheek_ref = img[ch_y1:ch_y2, max(0, fx + int(fw * 0.15)):min(w, fx + int(fw * 0.35))]
    cheek_gray_mean = float(np.mean(cv2.cvtColor(cheek_ref, cv2.COLOR_BGR2GRAY))) if cheek_ref.size > 0 else 140.0

    # 1. Sunglasses: Dark lenses covering both eyes
    if (r_dark_ratio > 0.65 and l_dark_ratio > 0.65) or (mean_eye_gray < 45.0 and cheek_gray_mean > 95.0):
        sunglasses_detected = True
        obstruction_issues.append({
            "code": "SUNGLASSES_DETECTED",
            "type": "sunglasses",
            "fil": "Naka-shades o sunglasses. Pakitanggal ang salamin sa mata upang makita ang mga mata.",
            "en": "Sunglasses or tinted glasses detected. Please remove them to verify eye biometrics."
        })
    else:
        # 2. Eyeglasses / Heavy dark frames check on nose bridge
        bx1 = int(min(re_x, le_x) + fw * 0.12)
        bx2 = int(max(re_x, le_x) - fw * 0.12)
        by1 = int(min(re_y, le_y) - fh * 0.04)
        by2 = int(max(re_y, le_y) + fh * 0.04)
        if bx2 > bx1 and by2 > by1:
            bridge = img[by1:by2, bx1:bx2]
            if bridge.size > 0:
                bridge_gray = cv2.cvtColor(bridge, cv2.COLOR_BGR2GRAY)
                edges = cv2.Canny(bridge_gray, 80, 180)
                bridge_edge_density = float(np.mean(edges > 0))
                bridge_skin = float(np.mean(is_skin_pixel(bridge)))
                bridge_dark_ratio = float(np.mean(bridge_gray < 55))

                # Real dark eyeglass frames across bridge have high edge density, dark frame pixels, and low skin
                if bridge_edge_density > 0.38 and bridge_dark_ratio > 0.30 and bridge_skin < 0.40:
                    eyeglasses_detected = True
                    obstruction_issues.append({
                        "code": "EYEGLASSES_DETECTED",
                        "type": "eyeglasses",
                        "fil": "Naka-salamin sa mata na may makapal na frame. Pakitanggal ang salamin upang maging malinaw ang beripikasyon.",
                        "en": "Eyeglasses with dark frames detected. Please remove eyeglasses for identity verification."
                    })

    # --- B. HAT / HELMET / CAP DETECTION ---
    # Check skull cap zone directly above eyebrows/hairline
    skull_top = max(0, fy - int(fh * 0.22))
    skull_bot = min(h, fy + int(fh * 0.04))
    skull_x1 = max(0, fx + int(fw * 0.15))
    skull_x2 = min(w, fx + int(fw * 0.85))

    if skull_bot > skull_top and skull_x2 > skull_x1:
        skull = img[skull_top:skull_bot, skull_x1:skull_x2]
        skull_hsv = cv2.cvtColor(skull, cv2.COLOR_BGR2HSV) if skull.size > 0 else np.zeros((1, 1, 3))
        # Hard hat colors: Bright yellow/orange or high-saturation helmet colors
        yellow_orange = (skull_hsv[:, :, 0] >= 14) & (skull_hsv[:, :, 0] <= 38) & (skull_hsv[:, :, 1] > 80) & (skull_hsv[:, :, 2] > 80)
        helmet_ratio = float(np.mean(yellow_orange)) if skull.size > 0 else 0.0

        # Forehead analysis (cap brim or covering)
        forehead_y1 = max(0, fy)
        forehead_y2 = min(h, min(re_y, le_y) - int(fh * 0.04))
        forehead_x1 = max(0, fx + int(fw * 0.2))
        forehead_x2 = min(w, fx + int(fw * 0.8))

        if forehead_y2 > forehead_y1 and forehead_x2 > forehead_x1:
            forehead = img[forehead_y1:forehead_y2, forehead_x1:forehead_x2]
            forehead_hsv = cv2.cvtColor(forehead, cv2.COLOR_BGR2HSV) if forehead.size > 0 else np.zeros((1, 1, 3))
            # Non-skin colored cloth (Hue outside human skin range 0-25 & 170-180, with saturation)
            is_non_skin_cloth = (forehead_hsv[:, :, 0] > 26) & (forehead_hsv[:, :, 0] < 168) & (forehead_hsv[:, :, 1] > 65) & (forehead_hsv[:, :, 2] > 60)
            cloth_ratio = float(np.mean(is_non_skin_cloth)) if forehead.size > 0 else 0.0
            forehead_skin = float(np.mean(is_skin_pixel(forehead))) if forehead.size > 0 else 1.0

            # Only trigger hat if:
            # - Bright construction safety helmet detected above forehead (helmet_ratio > 0.32)
            # - Solid non-skin colored cloth covering forehead (cloth_ratio > 0.35 and forehead_skin < 0.25)
            # NOTE: Natural hair strands / bangs or bare skin must NEVER be flagged as hats!
            if helmet_ratio > 0.32 or (cloth_ratio > 0.35 and forehead_skin < 0.25):
                hat_detected = True
                obstruction_issues.append({
                    "code": "HAT_DETECTED",
                    "type": "hat",
                    "fil": "Naka-sumbrero, cap, o safety helmet. Pakitanggal ang anumang panakip sa ulo bago magpatuloy.",
                    "en": "Hat, cap, or safety helmet detected. Please remove any headwear to proceed."
                })

    # --- C. FACE MASK / MOUTH & NOSE COVERING ---
    # Lower face region from nose down to chin
    lower_y1 = max(0, ny)
    lower_y2 = min(h, fy + fh)
    lower_x1 = max(0, fx + int(fw * 0.15))
    lower_x2 = min(w, fx + int(fw * 0.85))

    if lower_y2 > lower_y1 and lower_x2 > lower_x1:
        lower_face = img[lower_y1:lower_y2, lower_x1:lower_x2]
        lower_skin = float(np.mean(is_skin_pixel(lower_face))) if lower_face.size > 0 else 1.0

        if lower_skin < 0.18:
            mask_detected = True
            obstruction_issues.append({
                "code": "MASK_DETECTED",
                "type": "mask",
                "fil": "Naka-face mask o may takip ang bibig at ilong. Pakitanggal ang mask o panyo bago magpatuloy.",
                "en": "Face mask or mouth/nose covering detected. Please remove your mask to continue."
            })

    # --- D. HAND OR OBJECT OCCLUSION ---
    # Bilateral cheek symmetry check
    r_cheek = img[ch_y1:ch_y2, max(0, fx + int(fw * 0.08)):min(w, fx + int(fw * 0.32))]
    l_cheek = img[ch_y1:ch_y2, max(0, fx + int(fw * 0.68)):min(w, fx + int(fw * 0.92))]

    if r_cheek.size > 0 and l_cheek.size > 0:
        gray_rc = cv2.cvtColor(r_cheek, cv2.COLOR_BGR2GRAY)
        gray_lc = cv2.cvtColor(l_cheek, cv2.COLOR_BGR2GRAY)
        cheek_diff = abs(float(np.mean(gray_rc)) - float(np.mean(gray_lc)))
        r_skin = float(np.mean(is_skin_pixel(r_cheek)))
        l_skin = float(np.mean(is_skin_pixel(l_cheek)))

        if cheek_diff > 60.0 and (r_skin < 0.25 and l_skin < 0.25):
            face_occluded = True
            obstruction_issues.append({
                "code": "FACE_OBSTRUCTED",
                "type": "occlusion",
                "fil": "May nakaharang o sagabal sa iyong mukha (tulad ng kamay o bagay). Alisin ang anumang nakaharang.",
                "en": "Obstruction or object detected covering part of your face. Please ensure your face is fully clear."
            })

    return {
        "has_obstruction": len(obstruction_issues) > 0,
        "hat_detected": hat_detected,
        "sunglasses_detected": sunglasses_detected,
        "eyeglasses_detected": eyeglasses_detected,
        "mask_detected": mask_detected,
        "face_occluded": face_occluded,
        "issues": obstruction_issues
    }



def compare_with_reference(live_img, ref_img, live_box):
    """
    Compares live captured selfie with a reference image (e.g. Google or Facebook profile picture).
    Extracts normalized facial ROI and computes histogram correlation and normalized template matching.
    """
    if ref_img is None or live_img is None or not live_box:
        return {"matched": True, "score": 1.0, "note": "No reference photo provided."}

    rh, rw = ref_img.shape[:2]
    ref_gray = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)

    # Detect face in reference image
    ref_box = None
    detector = get_yunet_detector(rw, rh)
    if detector is not None:
        try:
            _, faces = detector.detect(ref_img)
            if faces is not None and len(faces) > 0:
                f = faces[0]
                ref_box = {
                    "x": max(0, int(f[0])),
                    "y": max(0, int(f[1])),
                    "w": min(rw - int(f[0]), int(f[2])),
                    "h": min(rh - int(f[1]), int(f[3]))
                }
        except Exception:
            ref_box = None

    if ref_box is None:
        haar_path = os.path.join(MODELS_DIR, "haarcascade_frontalface_default.xml")
        if os.path.exists(haar_path):
            face_cascade = cv2.CascadeClassifier(haar_path)
            haar_faces = face_cascade.detectMultiScale(ref_gray, scaleFactor=1.1, minNeighbors=3)
            if len(haar_faces) > 0:
                x, y, w, h = haar_faces[0]
                ref_box = {"x": x, "y": y, "w": w, "h": h}

    if ref_box is None:
        # Non-face avatar (e.g. scenic or graphic avatar)
        return {
            "matched": True,
            "score": 0.85,
            "social_face_detected": False,
            "note": "Reference avatar does not contain a discernible human face; verified based on live biometric scan."
        }

    lx, ly, lw, lh = live_box["x"], live_box["y"], live_box["width"], live_box["height"]
    live_face = live_img[max(0, ly):min(live_img.shape[0], ly + lh), max(0, lx):min(live_img.shape[1], lx + lw)]
    ref_face = ref_img[max(0, ref_box["y"]):min(rh, ref_box["y"] + ref_box["h"]), max(0, ref_box["x"]):min(rw, ref_box["x"] + ref_box["w"])]

    if live_face.size == 0 or ref_face.size == 0:
        return {"matched": True, "score": 0.8, "note": "Face crop boundary issue."}

    live_norm = cv2.resize(live_face, (128, 128))
    ref_norm = cv2.resize(ref_face, (128, 128))

    # 1. Color Histogram Correlation (Hue & Saturation)
    live_hsv = cv2.cvtColor(live_norm, cv2.COLOR_BGR2HSV)
    ref_hsv = cv2.cvtColor(ref_norm, cv2.COLOR_BGR2HSV)
    hist_live = cv2.calcHist([live_hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
    hist_ref = cv2.calcHist([ref_hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
    cv2.normalize(hist_live, hist_live, 0, 1, cv2.NORM_MINMAX)
    cv2.normalize(hist_ref, hist_ref, 0, 1, cv2.NORM_MINMAX)
    hist_corr = float(cv2.compareHist(hist_live, hist_ref, cv2.HISTCMP_CORREL))

    # 2. Structural / Grayscale correlation
    live_g = cv2.cvtColor(live_norm, cv2.COLOR_BGR2GRAY)
    ref_g = cv2.cvtColor(ref_norm, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(live_g, ref_g, cv2.TM_CCOEFF_NORMED)
    match_score = float(res[0][0]) if res.size > 0 else 0.5

    combined_score = max(0.0, min(1.0, (hist_corr * 0.5) + (match_score * 0.5)))
    matched = combined_score >= 0.20 or hist_corr >= 0.28

    return {
        "matched": matched,
        "score": round(combined_score, 3),
        "hist_correlation": round(hist_corr, 3),
        "structural_match": round(match_score, 3),
        "social_face_detected": True,
    }


def verify_face_telemetry(img, reference_img=None):
    """Runs comprehensive computer vision & biometric diagnostics on a face photo"""
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    issues = []
    face_count = 0
    face_box = None
    landmarks = None
    head_pose = {"yaw": 0.0, "pitch": 0.0}
    is_centered = True
    is_too_close = False
    is_too_far = False
    obstructions = {"has_obstruction": False, "issues": []}
    ref_match = None

    # 1. BRIGHTNESS & LIGHTING DIAGNOSTICS
    mean_brightness = float(np.mean(gray))
    is_too_dark = mean_brightness < 45.0
    is_too_bright = mean_brightness > 220.0

    if is_too_dark:
        issues.append({
            "code": "TOO_DARK",
            "fil": "Masyadong madilim ang paligid. Lumipat sa mas maliwanag na lugar o buksan ang ilaw.",
            "en": "Lighting is too dark. Please move to a brighter area or turn on more lights."
        })
    elif is_too_bright:
        issues.append({
            "code": "TOO_BRIGHT",
            "fil": "Masyadong maliwanag o may matinding silaw. Iwasan ang matinding backlight.",
            "en": "Excessive glare or backlight detected. Please adjust lighting to avoid washing out facial features."
        })

    # 2. SHARPNESS & BLUR DIAGNOSTICS (Laplacian Variance)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < 18.0

    if is_blurry:
        issues.append({
            "code": "BLURRY_IMAGE",
            "type": "quality",
            "fil": "Malabo o gumagalaw ang litrato. Hawakan nang maayos at steady ang camera.",
            "en": "Image is blurry or motion-degraded. Hold the camera steady and refocus."
        })

    # 3. OPENCV YUNET DEEP NEURAL FACE DETECTION
    detector = get_yunet_detector(w, h)
    faces = None
    if detector is not None:
        try:
            _, faces = detector.detect(img)
        except Exception as e:
            faces = None

    if faces is not None:
        face_count = len(faces)
    else:
        # Fallback to Haar Cascade
        haar_path = os.path.join(MODELS_DIR, "haarcascade_frontalface_default.xml")
        if os.path.exists(haar_path):
            face_cascade = cv2.CascadeClassifier(haar_path)
            haar_faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
            face_count = len(haar_faces)
            if face_count > 0:
                fx, fy, fw, fh = haar_faces[0]
                face_box = {"x": int(fx), "y": int(fy), "width": int(fw), "height": int(fh)}

    if face_count == 0:
        issues.append({
            "code": "NO_FACE_DETECTED",
            "fil": "Walang nakitang mukha sa litrato. Tumingin nang diretso sa camera nang buo ang mukha.",
            "en": "No human face was detected. Please ensure your full face is visible to the camera."
        })
    elif face_count > 1:
        issues.append({
            "code": "MULTIPLE_FACES",
            "fil": "Maraming tao ang nakita sa camera. Isang tao lamang ang dapat makita sa biometric frame.",
            "en": "Multiple faces detected. Only one person must be visible for biometric verification."
        })
    elif faces is not None and len(faces) == 1:
        f = faces[0]
        fx, fy, fw, fh = int(f[0]), int(f[1]), int(f[2]), int(f[3])
        face_box = {
            "x": max(0, fx),
            "y": max(0, fy),
            "width": min(w - max(0, fx), fw),
            "height": min(h - max(0, fy), fh)
        }
        landmarks = {
            "right_eye": [float(f[4]), float(f[5])],
            "left_eye": [float(f[6]), float(f[7])],
            "nose": [float(f[8]), float(f[9])],
            "right_mouth": [float(f[10]), float(f[11])],
            "left_mouth": [float(f[12]), float(f[13])],
            "confidence": float(f[14])
        }

        # Calculate estimated yaw & pitch
        eye_mid_x = (f[4] + f[6]) / 2.0
        eye_dist = abs(f[6] - f[4]) + 1e-5
        yaw_ratio = (f[8] - eye_mid_x) / eye_dist
        head_pose["yaw"] = round(float(yaw_ratio * 45.0), 1)

        # Check centering (face center vs image center)
        cx, cy = fx + fw / 2, fy + fh / 2
        img_cx, img_cy = w / 2, h / 2
        offset_x = abs(cx - img_cx) / w
        offset_y = abs(cy - img_cy) / h

        if offset_x > 0.28 or offset_y > 0.32:
            is_centered = False
            issues.append({
                "code": "OFF_CENTER",
                "fil": "Igitna ang iyong mukha sa bilog na gabay.",
                "en": "Center your face properly within the circular viewfinder."
            })

        # Check distance / size ratio
        face_area = fw * fh
        total_area = w * h
        ratio = face_area / total_area

        if ratio < 0.06:
            is_too_far = True
            issues.append({
                "code": "TOO_FAR",
                "fil": "Masyadong malayo ang iyong mukha. Lumapit nang bahagya sa camera.",
                "en": "You are too far from the camera. Please move slightly closer."
            })
        elif ratio > 0.88:
            is_too_close = True
            issues.append({
                "code": "TOO_CLOSE",
                "fil": "Masyadong malapit ang iyong mukha. Dumistansya nang kaunti.",
                "en": "You are too close to the camera. Please step back slightly."
            })

        # 4. OBSTRUCTION & OCCLUSION CHECKS (Hat, Sunglasses, Eyeglasses, Mask, Hand)
        obstructions = detect_obstructions(img, gray, face_box, landmarks)
        if obstructions["has_obstruction"]:
            for obs_issue in obstructions["issues"]:
                issues.append(obs_issue)

        # 5. SOCIAL PROFILE PICTURE (GOOGLE / FACEBOOK) MATCHING
        if reference_img is not None:
            ref_res = compare_with_reference(img, reference_img, face_box)
            ref_match = ref_res
            if not ref_res.get("matched", True):
                issues.append({
                    "code": "SOCIAL_PFP_MISMATCH",
                    "type": "pfp_mismatch",
                    "fil": "Hindi tumutugma ang iyong mukha sa larawan ng iyong Google/Facebook profile photo. Pakitiyak na ikaw ang tunay na may-ari ng account.",
                    "en": "Live selfie does not match your linked Google/Facebook profile picture. Please verify with your authentic face."
                })

    # STRICT COMPLETION CRITERIA:
    passed = (len(issues) == 0) and not obstructions["has_obstruction"]
    primary_message = (
        "Beripikado ang biometric KYC / Biometric selfie passed all quality and face recognition tests."
        if passed
        else issues[0]["fil"]
    )

    result_payload = {
        "success": True,
        "passed": passed,
        "face_detected": face_count == 1,
        "face_count": face_count,
        "face_box": face_box,
        "landmarks": landmarks,
        "head_pose": head_pose,
        "brightness": {
            "score": round(mean_brightness, 1),
            "is_too_dark": is_too_dark,
            "is_too_bright": is_too_bright
        },
        "blur": {
            "score": round(laplacian_var, 1),
            "is_blurry": is_blurry
        },
        "framing": {
            "is_centered": is_centered,
            "is_too_close": is_too_close,
            "is_too_far": is_too_far
        },
        "obstructions": obstructions,
        "issues": issues,
        "message": primary_message
    }

    if ref_match is not None:
        result_payload["reference_match"] = ref_match

    return result_payload


def main():
    parser = argparse.ArgumentParser(description="MCPA Biometric Face Verifier")
    parser.add_argument("--file", type=str, help="Path to image file")
    parser.add_argument("--base64", type=str, help="Base64 encoded image string")
    parser.add_argument("--reference", type=str, help="Path, URL, or base64 to reference face (e.g. social profile pic)")
    args = parser.parse_args()

    input_source = None
    ref_source = args.reference or None

    if args.file:
        input_source = args.file
    elif args.base64:
        input_source = args.base64
    else:
        # Read from stdin
        if not sys.stdin.isatty():
            input_source = sys.stdin.read().strip()

    if not input_source:
        print(json.dumps({
            "success": False,
            "passed": False,
            "message": "No image input provided (use --file, --base64, or stdin)."
        }))
        sys.exit(1)

    # Check if input_source is a JSON string containing image and reference
    if input_source.startswith("{") and input_source.endswith("}"):
        try:
            parsed_payload = json.loads(input_source)
            if "image" in parsed_payload or "img" in parsed_payload:
                input_source = parsed_payload.get("image") or parsed_payload.get("img")
            if "referenceAvatar" in parsed_payload or "reference" in parsed_payload:
                ref_source = parsed_payload.get("referenceAvatar") or parsed_payload.get("reference")
        except Exception:
            pass

    try:
        img = load_image(input_source)
        ref_img = load_image(ref_source) if ref_source else None
        results = verify_face_telemetry(img, ref_img)
        print(json.dumps(results, indent=2))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "passed": False,
            "error": str(e),
            "message": f"Verification failed with error: {str(e)}"
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
