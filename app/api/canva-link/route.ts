import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/app/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getAppConfig();
  const link = config.canvaInviteLink;
  if (!link) {
    return NextResponse.json({ error: "Canva invite link not configured" }, { status: 500 });
  }
  return NextResponse.json({ link });
}

export async function POST(req: NextRequest) {
  const config = await getAppConfig();
  const botToken = config.telegramBotToken;
  const chatId = config.telegramChatId;
  const link = config.canvaInviteLink;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || body.ip || "unknown";
  const location = body.location || "Unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();

  const message = `🎨 Canva Premium Click!\n\n📍 Location: ${location}\n🔗 IP: ${ip}\n🕐 Time: ${timestamp}\n🖥️ UA: ${userAgent}${link ? `\n🔗 Link: ${link}` : ""}`;

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: ac.signal,
    });
    clearTimeout(timer);
  } catch {}

  return NextResponse.json({ ok: true });
}
