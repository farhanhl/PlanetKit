import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("tool_usage")
      .select("id")
      .eq("tool_slug", slug)
      .eq("user_ip", ip)
      .gte("created_at", fiveMinAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const { error } = await supabase.from("tool_usage").insert({
      tool_slug: slug,
      user_ip: ip,
      user_agent: userAgent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "track failed" }, { status: 500 });
  }
}
