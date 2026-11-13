import { NextResponse } from "next/server";
import { getAppConfig } from "@/app/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getAppConfig();
    const apiKey = config.removeBgApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "Remove.bg API key not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.remove.bg/v1.0/account", {
      headers: {
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: res.status });
    }

    const data = await res.json();
    const attrs = data.data?.attributes || {};
    const total = attrs.api?.free_calls ?? 50;
    const remaining = attrs.credits?.total ?? 0;

    return NextResponse.json({
      total,
      remaining,
      elapsed: Math.max(0, total - remaining),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
