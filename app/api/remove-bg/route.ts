import { NextResponse } from "next/server";

const REMOVEBG_API = "https://api.remove.bg/v1.0/removebg";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const res = await fetch(REMOVEBG_API, {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY!,
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
