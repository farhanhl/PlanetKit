import { NextResponse } from "next/server";

const COBALT_API = "https://api.cobalt.tools";

interface MediaItem {
  url: string;
  type: "image" | "video";
  thumbnail?: string;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    const res = await fetch(COBALT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "max",
      }),
    });

    const data = await res.json();

    if (data.status === "error") {
      const errorCode = data.error?.code || "unknown";
      let message = "Failed to process Instagram URL";

      if (errorCode === "error.fetch.empty") message = "URL is empty";
      else if (errorCode === "error.fetch.bad") message = "Invalid URL format";
      else if (errorCode === "error.fetch.rate") message = "Rate limited. Please try again later.";
      else if (errorCode === "error.fetch.service.unsupported") message = "This Instagram URL is not supported";
      else if (errorCode === "error.fetch.content.video.live") message = "Live videos are not supported";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const media: MediaItem[] = [];

    // Handle tunnel/redirect — single file
    if (data.status === "tunnel" || data.status === "redirect") {
      const isVideo = data.filename?.endsWith(".mp4") || url.includes("/reel/");
      media.push({
        url: data.url,
        type: isVideo ? "video" : "image",
      });
    }

    // Handle picker — multiple files (carousel)
    if (data.status === "picker") {
      for (const item of data.picker || []) {
        media.push({
          url: item.url,
          type: item.type === "video" || item.type === "gif" ? "video" : "image",
          thumbnail: item.thumb,
        });
      }
    }

    if (media.length === 0) {
      return NextResponse.json(
        { error: "No media found. The post may be private or the URL is invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json({ media });
  } catch {
    return NextResponse.json({ error: "Failed to process Instagram URL" }, { status: 500 });
  }
}
