import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/icons/[name]
 * Serves platform icons directly from the API endpoint.
 * Supports .png extension or base name (e.g., /api/icons/user or /api/icons/user.png)
 */
export async function GET(request, { params }) {
  const resolvedParams = await params;
  let filename = resolvedParams?.name || "";

  if (!filename.endsWith(".png")) {
    filename += ".png";
  }

  // Sanitize path
  const safeFilename = path.basename(filename);
  const iconPath = path.join(process.cwd(), "public", "assets", "icons", safeFilename);

  if (fs.existsSync(iconPath)) {
    const fileBuffer = fs.readFileSync(iconPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return NextResponse.json({ error: "Icon not found" }, { status: 404 });
}
