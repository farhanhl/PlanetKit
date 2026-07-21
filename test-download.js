import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

puppeteerExtra.use(StealthPlugin());

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const surl = "0v-xEqZy85GmMB56yqI9KA";

const env = readFileSync(".env", "utf-8");
const cookieLine = env.split("\n").find(l => l.startsWith("TERABOX_COOKIE="));
const cookie = cookieLine ? cookieLine.split("=").slice(1).join("=").trim() : "";

const browser = await puppeteerExtra.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setUserAgent(UA);

const cookiePairs = {};
for (const part of cookie.split(";")) {
  const trimmed = part.trim();
  const eq = trimmed.indexOf("=");
  if (eq > 0) cookiePairs[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}
const pCookies = [];
for (const domain of [".1024terabox.com", ".1024tera.com", ".terabox.app", ".terabox.com"]) {
  for (const [name, value] of Object.entries(cookiePairs)) {
    pCookies.push({ name, value, domain, path: "/" });
  }
}
await page.setCookie(...pCookies);

const dlinks = [];
page.on("response", async (response) => {
  const url = response.url();
  if (url.includes("filemetas") || url.includes("share/download")) {
    try {
      const text = await response.text();
      const data = JSON.parse(text);
      console.log("API:", url.split("?")[0], "errno=" + data.errno);
      for (const entry of (data.list || data.info || [])) {
        if (entry.dlink) {
          dlinks.push(entry);
          console.log("  DLINK:", entry.server_filename, "->", entry.dlink.slice(0, 120));
        }
      }
    } catch {}
  }
});

// Try multiple times in case of rate limiting
for (let attempt = 1; attempt <= 3; attempt++) {
  console.log("\n=== Attempt", attempt, "===");
  try {
    await page.goto("https://www.terabox.app/sharing/link?surl=" + surl + "&clearCache=1", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 5000));

    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || "");
    
    if (bodyText.includes("errno") || bodyText.includes("errmsg")) {
      console.log("Got JSON error (rate limited), waiting 15s...");
      await new Promise(r => setTimeout(r, 15000));
      continue;
    }

    console.log("Page loaded! Body preview:", bodyText.slice(0, 200));

    // Check for download button
    const btn = await page.$(".download-btn");
    if (btn) {
      console.log("Found .download-btn, clicking...");
      await btn.click();
      await new Promise(r => setTimeout(r, 10000));
    }

    if (dlinks.length > 0) break;

    // Try in-page API calls
    console.log("\nTrying in-page JS API...");
    const result = await page.evaluate(async () => {
      try {
        const html = document.documentElement.innerHTML;
        const jtMatch = html.match(/fn%28%22([^"]+?)%22%29/);
        const jsToken = jtMatch ? jtMatch[1] : "";

        const listRes = await fetch(
          "/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=" +
          encodeURIComponent(jsToken) + "&page=1&num=100&by=name&order=asc&shorturl=" +
          "0v-xEqZy85GmMB56yqI9KA&root=1,",
          { credentials: "include" }
        );
        const listData = await listRes.json();

        if (listData.errno !== 0) return { errno: listData.errno, errmsg: listData.errmsg };

        let files = listData.list || [];
        const shareId = listData.share_id;

        if (files.length === 1 && (files[0].isdir === 1 || files[0].isdir === "1")) {
          const subRes = await fetch(
            "/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=" +
            encodeURIComponent(jsToken) + "&page=1&num=100&by=name&order=asc&shorturl=" +
            "0v-xEqZy85GmMB56yqI9KA&dir=" + encodeURIComponent(files[0].path),
            { credentials: "include" }
          );
          const subData = await subRes.json();
          files = subData.list || [];
        }

        const fileItems = files.filter(f => f.isdir === 0 || f.isdir === "0");
        if (fileItems.length === 0) return { error: "no downloadable files" };

        const fsIds = fileItems.map(f => f.fs_id);
        const dlRes = await fetch(
          "/api/filemetas?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=" +
          encodeURIComponent(jsToken) + "&shareid=" + shareId +
          "&sekey=0v-xEqZy85GmMB56yqI9KA&fsids=" +
          encodeURIComponent(JSON.stringify(fsIds)) + "&dlink=1&thumb=0",
          { credentials: "include" }
        );
        const dlData = await dlRes.json();

        const map = {};
        for (const entry of dlData.list || dlData.info || []) {
          if (entry.fs_id && entry.dlink) {
            map[entry.fs_id] = entry.dlink;
          }
        }
        return { errno: dlData.errno, fileCount: fileItems.length, dlinkCount: Object.keys(map).length, map };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log("In-page API result:", JSON.stringify(result).slice(0, 500));

    if (result.map) {
      for (const [fsId, dlink] of Object.entries(result.map)) {
        console.log("DLINK:", fsId, "->", String(dlink).slice(0, 120));
      }
    }

    break;
  } catch (e) {
    console.log("Error:", e.message);
  }
}

console.log("\n=== FINAL RESULT ===");
console.log("Total dlinks captured:", dlinks.length);

await browser.close();
