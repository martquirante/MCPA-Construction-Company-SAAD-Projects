import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  return NextResponse.json(
    {
      success: true,
      serverTimeUtc: now.toISOString(),
      timestamp: now.getTime(),
      timezone: "Asia/Manila",
      offsetMinutes: 480, // UTC+8
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
