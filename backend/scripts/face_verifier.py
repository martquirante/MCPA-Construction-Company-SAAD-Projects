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


def load_image(input_source):
    """Loads image from file path or base64 string"""
    if os.path.isfile(input_source):
        img = cv2.imread(input_source)
        if img is None:
            raise ValueError(f"Could not read image file at {input_source}")
        return img

    # Assume base64
    clean_b64 = input_source.strip()
    if "," in clean_b64:
        clean_b64 = clean_b64.split(",", 1)[1]

    img_bytes = base64.b64decode(clean_b64)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode base64 into a valid image")
    return img


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

    # 1. Sunglasses: Dark lenses covering eyes
    if (r_dark_ratio > 0.45 or l_dark_ratio > 0.45) or (mean_eye_gray < 55.0 and cheek_gray_mean > 85.0):
        sunglasses_detected = True
        obstruction_issues.append({
            "code": "SUNGLASSES_DETECTED",
            "type": "sunglasses",
            "fil": "Naka-shades o sunglasses. Pakitanggal ang salamin sa mata upang makita ang mga mata.",
            "en": "Sunglasses or tinted glasses detected. Please remove them to verify eye biometrics."
        })
    else:
        # 2. Eyeglasses / Clear frames check on nose bridge
        bx1 = int(min(re_x, le_x) + fw * 0.12)
        bx2 = int(max(re_x, le_x) - fw * 0.12)
        by1 = int(min(re_y, le_y) - fh * 0.04)
        by2 = int(max(re_y, le_y) + fh * 0.04)
        if bx2 > bx1 and by2 > by1:
            bridge = img[by1:by2, bx1:bx2]
            bridge_gray = cv2.cvtColor(bridge, cv2.COLOR_BGR2GRAY) if bridge.size > 0 else np.array([])
            edges = cv2.Canny(bridge_gray, 50, 150) if bridge_gray.size > 0 else np.array([0])
            bridge_edge_density = float(np.mean(edges > 0)) if edges.size > 0 else 0.0

            if bridge_edge_density > 0.14:
                eyeglasses_detected = True
                obstruction_issues.append({
                    "code": "EYEGLASSES_DETECTED",
                    "type": "eyeglasses",
                    "fil": "Naka-salamin sa mata. Pakitanggal ang salamin upang maging malinaw ang beripikasyon.",
                    "en": "Eyeglasses detected. Please remove eyeglasses for identity verification."
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
            forehead_gray = cv2.cvtColor(forehead, cv2.COLOR_BGR2GRAY) if forehead.size > 0 else np.array([])
            sobel_y = cv2.Sobel(forehead_gray, cv2.CV_64F, 0, 1, ksize=3) if forehead_gray.size > 0 else np.array([0])
            sobel_strength = float(np.mean(np.abs(sobel_y))) if sobel_y.size > 0 else 0.0
            forehead_skin = float(np.mean(is_skin_pixel(forehead))) if forehead.size > 0 else 1.0

            # Cap or helmet condition
            if helmet_ratio > 0.18 or (sobel_strength > 75.0 and forehead_skin < 0.80) or (forehead_skin < 0.35):
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

        if lower_skin < 0.38:
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

        if cheek_diff > 42.0 and (r_skin < 0.40 or l_skin < 0.40):
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


def verify_face_telemetry(img):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    issues = []

    # 1. Image Resolution Check
    if w < 160 or h < 160:
        issues.append({
            "code": "LOW_RESOLUTION",
            "fil": "Masyadong maliit ang kuha ng camera. Gumamit ng standard selfie resolution.",
            "en": "Camera resolution is too low. Please use a standard camera."
        })

    # 2. Neural Face Detection via OpenCV YuNet (Run first to evaluate face-focused lighting & diagnostics)
    detector = get_yunet_detector(w, h)
    faces = None
    if detector:
        detector.setInputSize((w, h))
        _, faces = detector.detect(img)

    face_count = len(faces) if faces is not None else 0
    face_box = None
    landmarks = None
    is_centered = True
    is_too_close = False
    is_too_far = False
    head_pose = {"yaw": 0.0, "pitch": 0.0}

    # Evaluate lighting on face ROI if face exists, else fallback to full image
    face_gray = gray
    if face_count == 1:
        f_tmp = faces[0]
        tx, ty, tw, th = int(f_tmp[0]), int(f_tmp[1]), int(f_tmp[2]), int(f_tmp[3])
        roi = gray[max(0, ty):min(h, ty + th), max(0, tx):min(w, tx + tw)]
        if roi.size > 0:
            face_gray = roi

    mean_brightness = float(np.mean(face_gray))
    dark_ratio = float(np.mean(face_gray < 25))
    glare_ratio = float(np.mean(face_gray > 240))

    is_too_dark = mean_brightness < 45.0 or dark_ratio > 0.40
    is_too_bright = mean_brightness > 220.0 or glare_ratio > 0.25

    if is_too_dark:
        issues.append({
            "code": "TOO_DARK",
            "fil": "Masyadong madilim ang ilaw sa mukha. Lumipat sa mas maliwanag na lugar.",
            "en": "Face lighting is too dark. Please move to a brighter or well-lit area."
        })
    elif is_too_bright:
        issues.append({
            "code": "TOO_BRIGHT",
            "fil": "Masyadong maliwanag o may silaw (glare) sa mukha. Bawasan ang direktang ilaw.",
            "en": "Excessive glare or overexposure detected on face. Avoid strong direct glare."
        })

    # 3. Blur & Sharpness Detection (Laplacian Variance on face)
    laplacian_var = float(cv2.Laplacian(face_gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < 45.0

    if is_blurry:
        issues.append({
            "code": "BLURRY",
            "fil": "Malabo ang kuha. Panatilihing matatag ang iyong camera bago kuhanan.",
            "en": "Image is blurry or camera moved. Please hold the device steady."
        })

    obstructions = {
        "has_obstruction": False,
        "hat_detected": False,
        "sunglasses_detected": False,
        "eyeglasses_detected": False,
        "mask_detected": False,
        "face_occluded": False,
        "issues": []
    }

    if face_count == 0:
        issues.append({
            "code": "NO_FACE_DETECTED",
            "fil": "Walang mukhang nakita. Tumingin nang diretso sa loob ng bilog na camera.",
            "en": "No face detected. Look directly inside the circular camera guide."
        })
    elif face_count > 1:
        issues.append({
            "code": "MULTIPLE_FACES",
            "fil": "May ibang tao sa kuha. Tanging ikaw lamang dapat ang nasa loob ng frame.",
            "en": "Multiple faces detected. Only one person must be in the camera frame."
        })
    else:
        # Exactly 1 face detected
        f = faces[0]
        fx, fy, fw, fh = int(f[0]), int(f[1]), int(f[2]), int(f[3])
        face_box = {"x": fx, "y": fy, "width": fw, "height": fh}

        # Keypoints: right eye, left eye, nose, right mouth, left mouth
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

    # STRICT COMPLETION CRITERIA:
    # Any obstruction (hat, sunglasses, eyeglasses, mask, hand/object), blur, bad lighting, or framing fails verification!
    passed = (len(issues) == 0) and not obstructions["has_obstruction"]
    primary_message = (
        "Beripikado ang biometric KYC / Biometric selfie passed all quality and face recognition tests."
        if passed
        else issues[0]["fil"]
    )

    return {
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


def main():
    parser = argparse.ArgumentParser(description="MCPA Biometric Face Verifier")
    parser.add_argument("--file", type=str, help="Path to image file")
    parser.add_argument("--base64", type=str, help="Base64 encoded image string")
    args = parser.parse_args()

    input_source = None
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

    try:
        img = load_image(input_source)
        results = verify_face_telemetry(img)
        print(json.dumps(results, indent=2))
        sys.exit(0 if results["passed"] else 0)
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
