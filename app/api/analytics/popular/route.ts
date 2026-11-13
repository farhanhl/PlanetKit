import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import { collection, query, getDocs, limit } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const toolUsageRef = collection(db, "tool_usage");
    const popularQuery = query(toolUsageRef, limit(1000));
    const snapshot = await getDocs(popularQuery);

    const counts = new Map<string, number>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.tool_slug;
      if (slug && typeof slug === "string") {
        counts.set(slug, (counts.get(slug) || 0) + 1);
      }
    });

    const popular = Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({ popular });
  } catch (error) {
    console.error("Fetch popular analytics failed:", error);
    return NextResponse.json({ popular: [] });
  }
}
