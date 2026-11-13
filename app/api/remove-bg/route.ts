import { NextResponse } from "next/server";
import { getAppConfig } from "@/app/lib/settings";

const REMOVEBG_API = "https://api.remove.bg/v1.0/removebg";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const config = await getAppConfig();
    const apiKey = config.removeBgApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "Remove.bg API key not configured" }, { status: 500 });
    }

    const formData = await request.formData();

    const res = await fetch(REMOVEBG_API, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      const message = error?.errors?.[0]?.detail || "Failed to remove background";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const creditsCharged = res.headers.get("X-Credits-Charged");
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        ...(creditsCharged ? { "X-Credits-Charged": creditsCharged } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to remove background" }, { status: 500 });
  }
}
