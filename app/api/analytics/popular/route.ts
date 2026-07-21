import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("tool_usage")
      .select("tool_slug")
      .limit(1000);

    if (error) {
      return NextResponse.json({ popular: [] });
    }

    const counts = new Map<string, number>();
    for (const row of rows || []) {
      counts.set(row.tool_slug, (counts.get(row.tool_slug) || 0) + 1);
    }

    const popular = Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({ popular });
  } catch {
    return NextResponse.json({ popular: [] });
  }
}
