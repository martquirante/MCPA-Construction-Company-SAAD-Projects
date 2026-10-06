#!/usr/bin/env node
/**
 * MCPA Architectural Portal - Standalone JavaScript Biometric & KYC Face Verifier CLI
 * Pure Node.js replacement for face_verifier.py (Zero OpenCV/Python dependencies).
 */

const fs = require("fs");
const { verifyFaceTelemetry } = require("../src/services/faceVerifierService");

async function main() {
  const args = process.argv.slice(2);
  let fileArg = null;
  let base64Arg = null;
  let refArg = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      fileArg = args[i + 1];
      i++;
    } else if (args[i] === "--base64" && args[i + 1]) {
      base64Arg = args[i + 1];
      i++;
    } else if (args[i] === "--reference" && args[i + 1]) {
      refArg = args[i + 1];
      i++;
    }
  }

  let inputSource = fileArg || base64Arg;
  let referenceSource = refArg;
  let clientMeta = null;

  if (!inputSource) {
    try {
      // Read from stdin if piped
      const stdinData = fs.readFileSync(0, "utf-8").trim();
      if (stdinData) {
        if (stdinData.startsWith("{") && stdinData.endsWith("}")) {
          const parsed = JSON.parse(stdinData);
          inputSource = parsed.image || parsed.img || parsed.file;
          referenceSource = parsed.referenceAvatar || parsed.reference;
          clientMeta = {
            landmarks: parsed.landmarks,
            faceBox: parsed.faceBox,
          };
        } else {
          inputSource = stdinData;
        }
      }
    } catch (e) {
      // Stdin not available or not piped
    }
  }

  if (!inputSource) {
    console.log(
      JSON.stringify({
        success: false,
        passed: false,
        message: "No image input provided (use --file, --base64, or stdin JSON).",
      })
    );
    process.exit(1);
  }

  try {
    const result = await verifyFaceTelemetry(inputSource, referenceSource, clientMeta);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.log(
      JSON.stringify({
        success: false,
        passed: false,
        error: err.message,
        message: `Verification failed with error: ${err.message}`,
      })
    );
    process.exit(1);
  }
}

main();
