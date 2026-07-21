import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.remove.bg/v1.0/account", {
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY!,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: res.status });
    }

    const data = await res.json();
    const attrs = data.data?.attributes || {};
    const total = attrs.api?.free_calls ?? 50;
    const elapsed = attrs.credits?.total ?? 0;

    return NextResponse.json({
      total,
      elapsed,
      remaining: total - elapsed,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
