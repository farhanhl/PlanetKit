import { NextResponse } from "next/server";

interface MediaItem {
  url: string;
  type: "image" | "video";
  thumbnail?: string;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || (!url.includes("twitter.com") && !url.includes("x.com"))) {
      return NextResponse.json({ error: "Invalid Twitter/X URL" }, { status: 400 });
    }

    // Extract tweet ID from URL
    const tweetIdMatch = url.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      return NextResponse.json({ error: "Could not extract tweet ID from URL" }, { status: 400 });
    }
    const tweetId = tweetIdMatch[1];

    // Use fxtwitter API
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch tweet data" }, { status: 502 });
    }

    const data = await res.json();
    const media: MediaItem[] = [];

    if (!data?.tweet?.media) {
      return NextResponse.json(
        { error: "No media found in this tweet. The tweet may not contain media or may be deleted." },
        { status: 404 }
      );
    }

    // Photos
    if (data.tweet.media.photos) {
      for (const photo of data.tweet.media.photos) {
        // fxtwitter returns direct photo URL
        let photoUrl = photo.url;
        // Ensure we get the full resolution
        if (photoUrl.includes("pbs.twimg.com")) {
          photoUrl = photoUrl.replace("?format=", "?format=jpg&name=large");
          if (!photoUrl.includes("name=")) {
            photoUrl += "&name=large";
          }
        }
        media.push({ url: photoUrl, type: "image" });
      }
    }

    // Videos
    if (data.tweet.media.videos) {
      for (const video of data.tweet.media.videos) {
        // fxtwitter returns the best quality video URL
        media.push({
          url: video.url,
          type: "video",
          thumbnail: video.thumbnail_url,
        });
      }
    }

    // GIFs (treated as video)
    if (data.tweet.media.gifs) {
      for (const gif of data.tweet.media.gifs) {
        media.push({
          url: gif.url,
          type: "video",
          thumbnail: gif.thumbnail_url,
        });
      }
    }

    if (media.length === 0) {
      return NextResponse.json(
        { error: "No media found in this tweet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ media });
  } catch {
    return NextResponse.json({ error: "Failed to process Twitter/X URL" }, { status: 500 });
  }
}
