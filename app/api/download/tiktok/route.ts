import { NextResponse } from "next/server";

const TIKWM_API = "https://www.tikwm.com/api/";

interface MediaItem {
  url: string;
  type: "image" | "video";
  thumbnail?: string;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("tiktok.com")) {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 });
    }

    const res = await fetch(`${TIKWM_API}?url=${encodeURIComponent(url)}`);

    const data = await res.json();

    if (data.code !== 0 || !data.data) {
      return NextResponse.json(
        { error: data.msg || "Failed to process TikTok URL" },
        { status: 400 }
      );
    }

    const media: MediaItem[] = [];

    if (data.data.play) {
      media.push({
        url: data.data.play,
        type: "video",
        thumbnail: data.data.cover,
      });
    }

    if (media.length === 0) {
      return NextResponse.json(
        { error: "No media found. The video may be private or the URL is invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json({ media });
  } catch {
    return NextResponse.json({ error: "Failed to process TikTok URL" }, { status: 500 });
  }
}
