import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "Telegram config missing" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const ip = body.ip || "unknown";
  const location = body.location || "Unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();

  const message = `🌐 New Website Visitor\n\n📍 Location: ${location}\n🔗 IP: ${ip}\n🕐 Time: ${timestamp}\n🖥️ UA: ${userAgent}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      cache: "no-store",
    });

    if (!tgRes.ok) {
      const tgBody = await tgRes.text();
      return NextResponse.json({ error: "Telegram send failed", detail: tgBody }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Telegram send failed", detail: String(e) }, { status: 500 });
  }
}
