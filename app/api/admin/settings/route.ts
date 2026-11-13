import { NextRequest, NextResponse } from "next/server";
import { getAppConfig, saveAppConfig } from "@/app/lib/settings";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get("x-admin-password");
  return Boolean(password && password === process.env.ANALYTICS_PASSWORD);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const config = await getAppConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("GET /api/admin/settings failed:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { telegramBotToken, telegramChatId, canvaInviteLink, removeBgApiKey } = body;

    await saveAppConfig({
      telegramBotToken: typeof telegramBotToken === "string" ? telegramBotToken.trim() : "",
      telegramChatId: typeof telegramChatId === "string" ? telegramChatId.trim() : "",
      canvaInviteLink: typeof canvaInviteLink === "string" ? canvaInviteLink.trim() : "",
      removeBgApiKey: typeof removeBgApiKey === "string" ? removeBgApiKey.trim() : "",
    });

    const updated = await getAppConfig();
    return NextResponse.json({ ok: true, config: updated });
  } catch (error) {
    console.error("POST /api/admin/settings failed:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

