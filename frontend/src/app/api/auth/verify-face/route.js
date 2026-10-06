import { NextResponse } from "next/server";
import { verifyFaceTelemetry } from "@/modules/shared/faceVerifierService";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image, referenceAvatar, landmarks, faceBox } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, passed: false, message: "No image provided for verification." },
        { status: 400 }
      );
    }

    const clientMeta = landmarks && faceBox ? { landmarks, faceBox } : null;
    const result = await verifyFaceTelemetry(image, referenceAvatar, clientMeta);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[verify-face route error]:", err);
    return NextResponse.json(
      { success: false, passed: false, message: "Verification processing error: " + err.message },
      { status: 500 }
    );
  }
}
