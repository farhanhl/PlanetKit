import { NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE_PUBLIC = "https://1024terabox.com";
const BASE_API = "https://dm.1024terabox.com";
const APP_ID = "250528";

interface FileItem {
  server_filename: string;
  fs_id: number;
  path: string;
  size: string;
  isdir: number;
  md5?: string;
  thumbs?: { url1?: string; url2?: string; url3?: string; icon?: string };
  dlink?: string;
}

interface MediaItem {
  url: string;
  type: "image" | "video" | "file";
  thumbnail?: string;
  filename: string;
  size: number;
}

function parseSurl(url: string): string {
  if (!url || typeof url !== "string") throw new Error("Empty input");
  let surl = "";
  if (url.includes("surl=")) {
    surl = url.split("surl=")[1]?.split("&")[0] || "";
  } else if (url.includes("/s/")) {
    surl = url.split("/s/")[1]?.split("?")[0]?.split("#")[0] || "";
  } else {
    const trimmed = url.trim();
    if (/^[A-Za-z0-9_-]+$/.test(trimmed) && trimmed.length >= 8) {
      surl = trimmed;
    }
  }
  if (!surl) throw new Error("Could not extract surl from URL");
  surl = surl.replace(/^1+/, "").slice(-23);
  if (surl.length < 8) throw new Error("surl too short after cleaning");
  return surl;
}

function findBetween(str: string, start: string, end: string): string {
  const si = str.indexOf(start);
  if (si === -1) return "";
  const s = si + start.length;
  const ei = str.indexOf(end, s);
  if (ei === -1) return "";
  return str.slice(s, ei);
}

function parseCookies(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of cookieStr.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      cookies[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return cookies;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function listShareFiles(
  surl: string,
  cookie: string,
  dir = "/"
): Promise<{ files: FileItem[]; shareId: number; uk: number; title: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": UA,
  };
  if (cookie) headers["Cookie"] = cookie;

  const params: Record<string, string> = {
    app_id: APP_ID,
    shorturl: surl,
    page: "1",
    num: "100",
    order: "name",
    desc: "0",
    showempty: "0",
    web: "1",
  };
  if (dir === "/") {
    params.root = "1,";
  } else {
    params.dir = dir;
  }

  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_PUBLIC}/share/list?${qs}`, { headers });
  const data = await res.json();
  if (data.errno !== 0) {
    throw new Error(data.errmsg || `errno=${data.errno}`);
  }
  return {
    files: data.list || [],
    shareId: data.share_id,
    uk: data.uk,
    title: data.title || "",
  };
}

async function getJsTokenFromPage(surl: string): Promise<string> {
  const res = await fetch(
    `${BASE_PUBLIC}/sharing/link?surl=${surl}`,
    { headers: { "User-Agent": UA } }
  );
  const html = await res.text();
  const token = findBetween(html, "fn%28%22", "%22%29");
  return token;
}

async function getBdsToken(cookie: string): Promise<string> {
  const cookies = parseCookies(cookie);
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Cookie: cookieHeader(cookies),
  };
  const res = await fetch(`${BASE_API}/main`, { headers });
  const html = await res.text();
  return (
    findBetween(html, 'bdstoken":"', '"') ||
    findBetween(html, "bdstoken='", "'") ||
    findBetween(html, 'bdstoken:', ",")
  );
}

async function resolveDlinks(
  fsIds: number[],
  cookie: string,
  jsToken: string,
  bdsToken: string,
  shareId: number,
  uk: number,
  surl: string
): Promise<Record<number, string>> {
  const cookies = parseCookies(cookie);
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": UA,
    "X-Requested-With": "XMLHttpRequest",
    Cookie: cookieHeader(cookies),
  };
  const fsidsParam = JSON.stringify(fsIds);
  const params = new URLSearchParams({
    app_id: APP_ID,
    web: "1",
    channel: "dubox",
    clienttype: "0",
    jsToken,
    bdstoken: bdsToken,
    shareid: String(shareId),
    uk: String(uk),
    sekey: surl,
    fsids: fsidsParam,
    dlink: "1",
    thumb: "0",
  });
  const res = await fetch(`${BASE_API}/api/filemetas?${params}`, { headers });
  const data = await res.json();
  const map: Record<number, string> = {};
  for (const entry of data.list || data.info || []) {
    if (entry.fs_id && entry.dlink) {
      map[entry.fs_id] = entry.dlink;
    }
  }
  return map;
}

async function collectFiles(
  surl: string,
  cookie: string,
  dirPath: string
): Promise<FileItem[]> {
  const allFiles: FileItem[] = [];
  const queue = [dirPath];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { files } = await listShareFiles(surl, cookie, current);
    for (const f of files) {
      if (Number(f.isdir) === 1) {
        queue.push(f.path);
      } else {
        allFiles.push(f);
      }
    }
  }
  return allFiles;
}

async function getBrowser() {
  const [{ default: PuppeteerExtra }, { default: StealthPlugin }] = await Promise.all([
    import("puppeteer-extra"),
    import("puppeteer-extra-plugin-stealth"),
  ]);
  PuppeteerExtra.use(StealthPlugin());
  return PuppeteerExtra;
}

async function resolveDlinksViaBrowser(
  surl: string,
  cookie: string,
  shareId: number,
  fsIds: number[]
): Promise<Record<number, string>> {
  const puppeteerExtra = (await import("puppeteer-extra")).default;
  const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
  puppeteerExtra.use(StealthPlugin());

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);

    const cookiePairs = parseCookies(cookie);
    const pCookies = Object.entries(cookiePairs).map(([name, value]) => ({
      name,
      value,
      domain: ".1024terabox.com",
      path: "/",
    }));
    await page.setCookie(...pCookies);

    const dlinkMap: Record<number, string> = {};

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/filemetas") || url.includes("/share/download")) {
        try {
          const data = await response.json();
          const entries = data.list || data.info || [];
          for (const entry of entries) {
            if (entry.fs_id && entry.dlink) {
              dlinkMap[entry.fs_id] = entry.dlink;
            }
          }
        } catch {
          // not JSON or parse error
        }
      }
    });

    await page.goto(`${BASE_PUBLIC}/sharing/link?surl=${surl}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector('a[href*="download"], [class*="download"], [data-download]', {
      timeout: 10000,
    }).catch(() => {});

    const downloadBtn = await page.$('a[href*="download"], [class*="download"], button[class*="download"]');
    if (downloadBtn) {
      await downloadBtn.click();
      await new Promise((r) => setTimeout(r, 5000));
    }

    if (Object.keys(dlinkMap).length === 0) {
      const apiResult = await page.evaluate(
        async (args) => {
          const { fsIds, shareId, surl } = args;
          try {
            const jsTokenEl = document.querySelector('script[id="n-data"]') ||
              document.querySelector('script');
            const pageHtml = document.documentElement.innerHTML;
            const jsTokenMatch = pageHtml.match(/fn%28%22([^%22]+)%22%29/);
            const jsToken = jsTokenMatch ? jsTokenMatch[1] : "";

            const res = await fetch(
              `/api/filemetas?app_id=250528&web=1&channel=dubox&clienttype=0` +
              `&jsToken=${encodeURIComponent(jsToken)}` +
              `&shareid=${shareId}&sekey=${surl}` +
              `&fsids=${encodeURIComponent(JSON.stringify(fsIds))}` +
              `&dlink=1&thumb=0`,
              { credentials: "include" }
            );
            const data = await res.json();
            const map: Record<number, string> = {};
            for (const entry of data.list || data.info || []) {
              if (entry.fs_id && entry.dlink) {
                map[entry.fs_id] = entry.dlink;
              }
            }
            return map;
          } catch {
            return {} as Record<number, string>;
          }
        },
        { fsIds, shareId, surl }
      );

      Object.assign(dlinkMap, apiResult);
    }

    return dlinkMap;
  } finally {
    await browser.close();
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const isTeraBox =
      url.includes("terabox") ||
      url.includes("teraboxapp") ||
      url.includes("1024tera") ||
      url.includes("dubox");

    if (!isTeraBox) {
      return NextResponse.json(
        { error: "Invalid TeraBox URL" },
        { status: 400 }
      );
    }

    let surl: string;
    try {
      surl = parseSurl(url);
    } catch {
      return NextResponse.json(
        { error: "Could not extract share ID from URL" },
        { status: 400 }
      );
    }

    const cookie = process.env.TERABOX_COOKIE || "";

    // Step 1: List root to check if directory
    let rootFiles: FileItem[];
    let title: string;
    let shareId = 0;
    let uk = 0;
    try {
      const root = await listShareFiles(surl, cookie, "/");
      rootFiles = root.files;
      title = root.title;
      shareId = root.shareId;
      uk = root.uk;
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to list share: ${(e as Error).message}` },
        { status: 502 }
      );
    }

    // Step 2: If root is a single directory, go inside
    if (rootFiles.length === 1 && Number(rootFiles[0].isdir) === 1) {
      try {
        rootFiles = (await listShareFiles(surl, cookie, rootFiles[0].path)).files;
      } catch {
        // keep rootFiles as-is
      }
    }

    // Step 3: Collect all files recursively
    const allFiles: FileItem[] = [];
    const dirs: string[] = [];
    for (const f of rootFiles) {
      if (Number(f.isdir) === 1) {
        dirs.push(f.path);
      } else {
        allFiles.push(f);
      }
    }
    for (const d of dirs) {
      try {
        const sub = await collectFiles(surl, cookie, d);
        allFiles.push(...sub);
      } catch {
        // skip inaccessible dirs
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "No downloadable files found in this share." },
        { status: 404 }
      );
    }

    // Step 4: Try to get dlinks if cookie is available
    let dlinkMap: Record<number, string> = {};
    if (cookie) {
      try {
        const jsToken = await getJsTokenFromPage(surl);
        const bdsToken = await getBdsToken(cookie);
        if (jsToken && bdsToken) {
          const fsIds = allFiles.map((f) => f.fs_id);
          dlinkMap = await resolveDlinks(fsIds, cookie, jsToken, bdsToken, shareId, uk, surl);
        }
      } catch {
        // dlinks unavailable, proceed without them
      }

      // Fallback: use headless browser if no dlinks yet
      if (Object.keys(dlinkMap).length === 0) {
        try {
          const fsIds = allFiles.map((f) => f.fs_id);
          dlinkMap = await resolveDlinksViaBrowser(surl, cookie, shareId, fsIds);
        } catch {
          // browser fallback failed, proceed without dlinks
        }
      }
    }

    // Step 5: Build response
    const media: MediaItem[] = allFiles.map((f) => {
      const ext = f.server_filename.split(".").pop()?.toLowerCase() || "";
      const isVideo = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v"].includes(ext);
      const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext);

      return {
        url: dlinkMap[f.fs_id] || `${BASE_PUBLIC}/sharing/link?surl=${surl}`,
        type: isVideo ? "video" : isImage ? "image" : "file",
        thumbnail: f.thumbs?.url3 || f.thumbs?.url2 || undefined,
        filename: f.server_filename,
        size: parseInt(f.size || "0", 10),
      };
    });

    return NextResponse.json({ title, media, hasDlink: Object.keys(dlinkMap).length > 0 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process TeraBox URL" },
      { status: 500 }
    );
  }
}
