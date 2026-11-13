# 🐛 PlanetKit — Bug Report

> Generated: 2026-11-13 | Analyzed: 100+ files across all tools, components, API routes, and libraries.

---

## Legenda Severity

| Label | Arti |
|-------|------|
| 🔴 **Critical** | Menyebabkan crash, kerusakan data, atau celah keamanan serius |
| 🟠 **High** | Fungsionalitas rusak atau logic error yang merugikan pengguna |
| 🟡 **Medium** | Perilaku tidak terduga, performa buruk, atau UX mengecewakan |
| 🟢 **Low** | Minor, kosmetik, atau technical debt |

---

## 1. Infrastruktur & Konfigurasi

### 🔴 BUG-001 — `next.config.ts`: Build crash jika `REMOVEBG_API_KEY` tidak di-set

**File:** [`next.config.ts`](file:///c:/project/PlanetKit/next.config.ts#L7-L9)

```ts
if (!process.env.REMOVEBG_API_KEY) {
  throw new Error("REMOVEBG_API_KEY environment variable is not set.");
}
```

**Masalah:** `throw` di top-level config file akan **crash seluruh build & dev server** (`next dev`, `next build`) jika environment variable belum di-set. Ini terjadi bahkan jika developer hanya ingin menjalankan tools lain.

**Dampak:** Tidak bisa menjalankan proyek sama sekali tanpa semua env vars.

**Fix:** Gunakan `console.warn()` saja, atau cek hanya saat runtime di API route.

---

### 🟠 BUG-002 — `app/lib/supabase.ts`: Non-null assertion tanpa validasi

**File:** [`app/lib/supabase.ts`](file:///c:/project/PlanetKit/app/lib/supabase.ts#L3-L6)

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Masalah:** Operator `!` (non-null assertion) menyembunyikan error. Jika env vars tidak di-set, `createClient` akan menerima `undefined` dan gagal secara runtime dengan pesan error yang tidak jelas.

**Fix:** Tambahkan validasi eksplisit sebelum `createClient`.

---

### 🟡 BUG-003 — `package.json`: Package `xlsx` versi lama dengan vulnerability

**File:** [`package.json`](file:///c:/project/PlanetKit/package.json#L40)

```json
"xlsx": "^0.18.5"
```

**Masalah:** `xlsx@0.18.x` adalah versi lama (SheetJS Community Edition yang di-fork). Versi ini memiliki known vulnerabilities. Versi terbaru sudah dipindahkan ke `xlsx@^0.20.x` atau paket pengganti.

---

### 🟡 BUG-004 — `next.config.ts`: `allow-same-origin` pada iframe playground membuka risiko

**File:** [`app/tools/html-playground/page.tsx`](file:///c:/project/PlanetKit/app/tools/html-playground/page.tsx#L129)

```tsx
sandbox="allow-scripts allow-same-origin"
```

**Masalah:** Kombinasi `allow-scripts` + `allow-same-origin` pada `<iframe>` **menghapus efek sandbox** sepenuhnya — script di iframe bisa mengakses `localStorage`, `cookies`, dan DOM parent. Ini XSS potensial.

**Fix:** Hapus `allow-same-origin`. Gunakan hanya `sandbox="allow-scripts"` untuk playground.

---

## 2. API Routes

### 🟠 BUG-005 — `api/canva-link/route.ts`: IP dan lokasi dari body client tidak terverifikasi

**File:** [`app/api/canva-link/route.ts`](file:///c:/project/PlanetKit/app/api/canva-link/route.ts#L20-L21)

```ts
const ip = body.ip || "unknown";
const location = body.location || "Unknown";
```

**Masalah:** IP dan lokasi diterima dari body request client — mudah dipalsukan. Siapapun bisa mengirim IP/lokasi palsu ke Telegram. IP seharusnya dibaca dari header request server (`x-forwarded-for`, `cf-connecting-ip`).

**Dampak:** Log/analytics Telegram tidak akurat dan bisa dimanipulasi.

---

### 🟡 BUG-006 — `api/credits/route.ts`: Naming variable membingungkan (`elapsed` vs `used`)

**File:** [`app/api/credits/route.ts`](file:///c:/project/PlanetKit/app/api/credits/route.ts#L17-L23)

```ts
const total = attrs.api?.free_calls ?? 50;
const elapsed = attrs.credits?.total ?? 0;    // ← bukan "elapsed", ini "used"
return NextResponse.json({
  total,
  elapsed,
  remaining: total - elapsed,
});
```

**Masalah:** Nama variabel `elapsed` tidak tepat — ini seharusnya `used`. Lebih serius: nilai yang dipakai adalah `attrs.credits?.total` sebagai "jumlah kredit yang dipakai", padahal nama field di API remove.bg bisa berarti "total kredit yang pernah dimiliki". Ini **bisa menghasilkan sisa kredit negatif** jika mapping salah.

---

### 🟡 BUG-007 — `api/notify-visitor/route.ts`: Error detail internal dikirim ke client

**File:** [`app/api/notify-visitor/route.ts`](file:///c:/project/PlanetKit/app/api/notify-visitor/route.ts#L35)

```ts
return NextResponse.json({ error: "Telegram send failed", detail: String(e) }, { status: 500 });
```

**Masalah:** Stack trace / error detail dikirimkan ke client. Ini bisa membocorkan informasi konfigurasi internal.

---

## 3. Library `pdf-encrypt.ts`

### 🔴 BUG-008 — MD5 Padding Logic Salah — Enkripsi PDF Rusak

**File:** [`app/lib/pdf-encrypt.ts`](file:///c:/project/PlanetKit/app/lib/pdf-encrypt.ts#L28-L59)

```ts
const msg = new Uint8Array(message.length + 1);
msg.set(message);
msg[message.length] = 0x80;
// ...
if (msg.length % 64 < 56) { ... }  // ← SALAH
```

**Masalah Kritis (1) — Off-by-one padding:** Alokasi `message.length + 1` untuk padding byte `0x80` tidak benar untuk semua kasus. Jika panjang pesan membuat `msg.length % 64 >= 56`, blok `else` memakai ukuran padding yang salah.

**Masalah Kritis (2) — Index M[] pada processMd5 salah:**

```ts
M[j] = data[i + j * 4] | ...  // hanya mengisi M[0..15]
// lalu:
F + ... + M[j === 16 ? (5 * j + 1) % 16 : j < 32 ? (3 * j + 5) % 16 : (7 * j) % 16]
```

Ketika `j === 0..15`, array M diakses langsung. Tapi ketika `j >= 16`, formula `(5*j+1)%16` mengacu ke slot yang sudah diisi. Namun lebih parah: ketika `j=16`, kondisi `j === 16 ? (5*j+1)%16` → `(80+1)%16 = 1`. Ini tidak sesuai algoritma MD5 standar yang seharusnya `g = (5*j + 1) % 16`.

**Dampak:** PDF yang dienkripsi menggunakan library ini **kemungkinan tidak bisa dibuka oleh PDF reader manapun** karena enkripsi RC4 menggunakan kunci yang dihasilkan dari MD5 yang salah.

---

### 🟠 BUG-009 — `pdf-encrypt.ts`: Encryption key menggunakan `Math.random()` (tidak secure)

**File:** [`app/lib/pdf-encrypt.ts`](file:///c:/project/PlanetKit/app/lib/pdf-encrypt.ts#L152)

```ts
for (let i = 0; i < 5; i++) encryptionKey[i] = Math.floor(Math.random() * 256);
```

**Masalah:** `Math.random()` **tidak cryptographically secure**. Untuk enkripsi PDF yang sebenarnya, harus menggunakan `crypto.getRandomValues()`.

---

### 🟡 BUG-010 — `pdf-encrypt.ts`: Owner key dihitung salah (RC4 method)

**File:** [`app/lib/pdf-encrypt.ts`](file:///c:/project/PlanetKit/app/lib/pdf-encrypt.ts#L155-L156)

```ts
const ownerStep1 = md5(paddedPassword);
const ownerKey = rc4(ownerStep1, encryptionKey);  // ← seharusnya: rc4(md5(md5(ownerPassword)), paddedUser)
```

**Masalah:** Menurut PDF spec (Algorithm 3 — Computing O), owner key dihitung dengan algoritma berbeda: `O = RC4(MD5(paddedOwner), paddedUser)`. Implementasi ini salah karena menggunakan `encryptionKey` sebagai plaintext, bukan `paddedPassword` sebagai key.

---

## 4. Tools — PDF

### 🟠 BUG-011 — `encrypt-pdf/page.tsx`: Nama file & function menyesatkan (ini DECRYPT, bukan ENCRYPT)

**File:** [`app/tools/encrypt-pdf/page.tsx`](file:///c:/project/PlanetKit/app/tools/encrypt-pdf/page.tsx#L10)

```ts
export default function DecryptPdfPage() {  // ← route: /tools/encrypt-pdf
```

**Masalah:** Route-nya `/tools/encrypt-pdf`, tapi component name `DecryptPdfPage` dan fungsionalitasnya adalah **mendekripsi** PDF (menghilangkan password). Naming sangat menyesatkan dan ToolSeo mengirim path `/tools/encrypt-pdf` untuk tool yang mendekripsi.

---

### 🟠 BUG-012 — `encrypt-pdf/page.tsx`: "Decryption" sebenarnya re-render ke canvas (lossy)

**File:** [`app/tools/encrypt-pdf/page.tsx`](file:///c:/project/PlanetKit/app/tools/encrypt-pdf/page.tsx#L60-L69)

```ts
const canvas = document.createElement("canvas");
// render page ke canvas
const imgData = canvas.toDataURL("image/png");
pdfOut.addImage(imgData, "PNG", 0, 0, p.width, p.height);
```

**Masalah:** "Decrypt" dilakukan dengan cara me-render setiap halaman ke canvas PNG lalu membuat PDF baru dari gambar tersebut. Ini:
1. **Menghilangkan semua teks yang bisa dicopy** (PDF jadi gambar)
2. **Meningkatkan ukuran file drastis** (PNG per halaman)
3. **Skala render `scale: 2`** membuat canvas sangat besar → potensi crash pada PDF banyak halaman

---

### 🟡 BUG-013 — `split-pdf/page.tsx`: Split gagal jika "remove" mode dipilih dan semua halaman diselect

**File:** [`app/tools/split-pdf/page.tsx`](file:///c:/project/PlanetKit/app/tools/split-pdf/page.tsx#L111-L116)

```ts
const pagesToCopy =
  mode === "keep"
    ? Array.from(selectedPages).sort(...)
    : Array.from({ length: pageCount }, (_, i) => i + 1).filter(
        (p) => !selectedPages.has(p)
      );
```

**Masalah:** Jika mode "remove" dan semua halaman dipilih, `pagesToCopy` akan array kosong. Lalu `newPdf.copyPages(pdf, [])` dipanggil, menghasilkan PDF kosong yang didownload tanpa error. Tidak ada validasi untuk kasus ini.

**Fix:** Tambah cek `if (pagesToCopy.length === 0) { setError(...); return; }`.

---

### 🟡 BUG-014 — `compress-pdf/page.tsx`: "Compress" tidak benar-benar mengkompresi gambar

**File:** [`app/tools/compress-pdf/page.tsx`](file:///c:/project/PlanetKit/app/tools/compress-pdf/page.tsx#L53-L61)

```ts
pdf.setTitle("");
pdf.setAuthor("");
// ... (hanya strip metadata)
const bytes = await pdf.save({ useObjectStreams: true });
```

**Masalah:** Fungsi ini hanya **menghapus metadata** dan menggunakan object streams. Gambar/font di dalam PDF tidak dikompres sama sekali. Untuk banyak PDF (terutama yang berbasis teks), hasilnya bisa **lebih besar** dari original. Ini misleading bagi pengguna.

---

### 🟡 BUG-015 — `merge-pdf/page.tsx`: pdfjs worker di-set ulang setiap kali file di-upload

**File:** [`app/tools/merge-pdf/page.tsx`](file:///c:/project/PlanetKit/app/tools/merge-pdf/page.tsx#L26)

```ts
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

**Masalah:** `GlobalWorkerOptions.workerSrc` di-set di dalam callback yang berjalan setiap kali file di-upload. Meskipun tidak crash, ini operasi yang tidak perlu dan sebaiknya dilakukan sekali di luar loop.

---

## 5. Tools — Image

### 🟠 BUG-016 — `image-to-text/page.tsx`: Tesseract hardcode ke bahasa "eng" saja

**File:** [`app/tools/image-to-text/page.tsx`](file:///c:/project/PlanetKit/app/tools/image-to-text/page.tsx#L45)

```ts
const result = await Tesseract.recognize(files[i], "eng", { ... });
```

**Masalah:** Hanya mendukung bahasa Inggris (`"eng"`). File `ind.traineddata` ada di root proyek tapi tidak digunakan. Pengguna Indonesia tidak mendapat hasil OCR yang baik.

---

### 🟡 BUG-017 — `remove-bg/page.tsx`: Fetch credits dilakukan **dua kali** saat mount

**File:** [`app/tools/remove-bg/page.tsx`](file:///c:/project/PlanetKit/app/tools/remove-bg/page.tsx#L26-L47)

```ts
// fetchCredits callback (dipanggil manual setelah proses)
const fetchCredits = useCallback(() => {
  fetch("/api/credits")...
}, []);

// useEffect (dipanggil saat mount)
useEffect(() => {
  fetch("/api/credits")...  // ← duplikat!
}, []);
```

**Masalah:** Dua fetch ke `/api/credits` terjadi saat halaman pertama dimuat — `fetchCredits` callback dan `useEffect` inline. Seharusnya `useEffect` cukup memanggil `fetchCredits()`.

---

### 🟡 BUG-018 — `remove-bg/page.tsx`: `originalUrl` tidak direvokeObjectURL saat reset

**File:** [`app/tools/remove-bg/page.tsx`](file:///c:/project/PlanetKit/app/tools/remove-bg/page.tsx#L114-L120)

```ts
const reset = () => {
  setOriginalFile(null);
  setOriginalUrl("");  // ← URL lama tidak di-revoke!
  setResultUrl("");    // ← URL lama tidak di-revoke!
  ...
};
```

**Masalah:** Saat `reset()` dipanggil, object URL lama tidak di-revoke. Memory leak pada setiap reset.

---

### 🟡 BUG-019 — `compress-image/page.tsx`: Estimasi ukuran dijalankan penuh (bukan debounce) saat quality slider bergerak

**File:** [`app/tools/compress-image/page.tsx`](file:///c:/project/PlanetKit/app/tools/compress-image/page.tsx#L42-L82)

```ts
useEffect(() => {
  // ... melakukan kompresi penuh untuk estimasi
  const compressed = await imageCompression(file, { initialQuality: toLibQuality(quality), ... });
}, [files, quality]);
```

**Masalah:** Setiap kali slider quality bergerak 1 step, `imageCompression` dijalankan penuh untuk **semua file**. Ini sangat berat dan bisa membuat UI freeze. Perlu debounce (misalnya 500ms) sebelum menjalankan estimasi.

---

### 🟠 BUG-020 — `image-exif-editor/page.tsx`: Deteksi tipe JPEG tidak lengkap

**File:** [`app/tools/image-exif-editor/page.tsx`](file:///c:/project/PlanetKit/app/tools/image-exif-editor/page.tsx#L87)

```ts
if (!f.type.includes("jpeg") && !f.type.includes("jpg")) {
```

**Masalah:** MIME type untuk JPEG adalah `image/jpeg` — tidak pernah mengandung string `"jpg"`. Kondisi `f.type.includes("jpg")` selalu `false`. Meskipun kondisi pertama (`"jpeg"`) sudah benar, cek kedua adalah dead code yang membingungkan.

---

## 6. Tools — Dev/Utility

### 🟠 BUG-021 — `regex-tester/page.tsx`: ReDoS (Regex Denial of Service) tidak dibatasi

**File:** [`app/tools/regex-tester/page.tsx`](file:///c:/project/PlanetKit/app/tools/regex-tester/page.tsx#L22-L33)

```ts
const regex = new RegExp(pattern, flags);
let m;
while ((m = regex.exec(testStr)) !== null) {
  results.push({ match: m[0], index: m.index });
  if (m[0] === "") regex.lastIndex++;
}
```

**Masalah:** Regex berbahaya seperti `(a+)+` dengan string `"aaaaaaaaaaaab"` akan menyebabkan **browser hang** (catastrophic backtracking). Tidak ada timeout atau limit jumlah matches.

**Fix:** Tambahkan batas maksimum matches dan/atau jalankan regex di Web Worker dengan timeout.

---

### 🟠 BUG-022 — `html-playground/page.tsx`: `doc.write()` pada iframe bisa crash di browser modern

**File:** [`app/tools/html-playground/page.tsx`](file:///c:/project/PlanetKit/app/tools/html-playground/page.tsx#L64-L69)

```ts
const doc = iframeRef.current.contentDocument;
if (doc) {
  doc.open();
  doc.write(html);
  doc.close();
}
```

**Masalah:** `document.write()` sudah deprecated di browser modern dan berperilaku berbeda antar browser. Lebih aman menggunakan `srcdoc` attribute atau `Blob` + `URL.createObjectURL`.

---

### 🟡 BUG-023 — `html-playground/page.tsx`: Tab "JS" menampilkan `<script>` tag di textarea (UX buruk)

**File:** [`app/tools/html-playground/page.tsx`](file:///c:/project/PlanetKit/app/tools/html-playground/page.tsx#L110)

```tsx
value={`<script>\n${html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ""}\n</script>`}
```

**Masalah:** Textarea JS menampilkan konten dengan `<script>` dan `</script>` tags ikut tampil. Pengguna harus edit konten di dalam tag ini — tidak intuitif.

---

### 🟡 BUG-024 — `jwt-decoder/page.tsx`: Payload values yang mengandung `:` dipotong salah

**File:** [`app/tools/jwt-decoder/page.tsx`](file:///c:/project/PlanetKit/app/tools/jwt-decoder/page.tsx#L89-L93)

```ts
const [key, ...rest] = line.split(":");
// ...
<span>{rest.join(":").trim()}</span>
```

**Masalah:** Ini sebenarnya sudah dihandle dengan `rest.join(":")`. Namun fungsi `formatPayload` menghasilkan format `key: value` dengan `:` sebagai separator — jika value mengandung `:` (misalnya timestamp ISO `2024-01-01T00:00:00`), split pertama menghasilkan `["key", " 2024-01-01T00", "00", "00"]`. `join(":")` akan menyambungkan kembali, hasilnya benar, tapi lebih clean menggunakan `indexOf` daripada `split/join`.

---

### 🟡 BUG-025 — `password-generator/page.tsx`: Modulo bias pada karakter yang dihasilkan

**File:** [`app/tools/password-generator/page.tsx`](file:///c:/project/PlanetKit/app/tools/password-generator/page.tsx#L26-L28)

```ts
const arr = new Uint32Array(length);
crypto.getRandomValues(arr);
setPassword(Array.from(arr, (v) => chars[v % chars.length]).join(""));
```

**Masalah:** `v % chars.length` memiliki **modulo bias** jika `2^32` tidak habis dibagi `chars.length`. Karakter di awal charset lebih sering muncul. Untuk password generator yang benar-benar uniform, perlu rejection sampling.

Ini low-impact untuk penggunaan umum tapi penting untuk security tool.

---

## 7. Tools — Finance & Calculators

### 🟠 BUG-026 — `profit-calculator/page.tsx`: Formula profit salah (double pip multiplication)

**File:** [`app/tools/profit-calculator/page.tsx`](file:///c:/project/PlanetKit/app/tools/profit-calculator/page.tsx#L25-L27)

```ts
const pips = pip > 0 ? Math.abs(exit - entry) / pip : 0;
const profitPips = pips * lots * (exit > entry ? 1 : exit < entry ? -1 : 0);
const profitUSD = profitPips * pip * contract;
```

**Masalah:** `profitPips` sudah dihitung dalam satuan pip (berdasarkan lots). Lalu `profitUSD = profitPips * pip * contract` **mengalikan pip size lagi**. Formula yang benar adalah:

```
profit = (exit - entry) / pip * pipValuePerLot * lots
```

Dengan formula saat ini, hasilnya akan sangat kecil (dikalikan `0.0001` lagi). Sebaiknya bandingkan dengan `pip-calculator/page.tsx` line 50 yang menggunakan:
```ts
const profit = pips * pipSize * lots * 100000;  // pip-calculator (lebih sederhana)
```

---

### 🟠 BUG-027 — `margin-calculator/page.tsx`: `accountCurrency` tidak digunakan dalam kalkulasi

**File:** [`app/tools/margin-calculator/page.tsx`](file:///c:/project/PlanetKit/app/tools/margin-calculator/page.tsx#L34-L35)

```ts
const contractSize = lots * 100000;
const marginRequired = contractSize / lev;
```

**Masalah:** `accountCurrency` dipilih pengguna tapi tidak digunakan dalam formula apapun. Margin selalu dihitung dalam USD regardless valuta akun. Untuk pair seperti `EUR/USD` dengan akun EUR, hasilnya akan salah karena tidak ada konversi.

---

### 🟡 BUG-028 — `pip-calculator/page.tsx`: Contract size hardcoded 100,000 tidak valid untuk semua pair

**File:** [`app/tools/pip-calculator/page.tsx`](file:///c:/project/PlanetKit/app/tools/pip-calculator/page.tsx#L50)

```ts
const profit = pips * pipSize * lots * 100000;
```

**Masalah:** Contract size 100,000 (standard lot) di-hardcode. Untuk Metals (XAU/USD, XAG/USD), contract size berbeda (XAU = 100 troy oz, bukan 100,000). Kalkulasi profit untuk gold/silver akan salah.

---

## 8. Components

### 🟡 BUG-029 — `LanguageProvider` (`context.tsx`): Konten tidak dirender saat terjemahan belum dimuat

**File:** [`app/lib/i18n/context.tsx`](file:///c:/project/PlanetKit/app/lib/i18n/context.tsx#L82)

```ts
if (!t) return null;
```

**Masalah:** Saat terjemahan belum di-load (async), **seluruh aplikasi** (`children`) tidak dirender — blank screen. Tidak ada loading indicator. Ini bisa menyebabkan layout shift yang signifikan (CLS) dan pengalaman blank yang buruk.

---

### 🟡 BUG-030 — `FileUploader.tsx`: Validasi file type hanya berdasarkan ekstensi (bisa dibypass)

**File:** [`app/components/FileUploader.tsx`](file:///c:/project/PlanetKit/app/components/FileUploader.tsx#L44-L46)

```ts
const dropped = allFiles.filter((f) =>
  acceptedExts.some((ext) => f.name.toLowerCase().endsWith(ext))
);
```

**Masalah:** Validasi hanya berdasarkan ekstensi nama file. Pengguna bisa mengubah nama file `malicious.exe` menjadi `malicious.pdf` dan berhasil melewati validasi. Sebaiknya juga cek `f.type` (MIME type).

---

### 🟡 BUG-031 — `VisitorNotifier.tsx`: Data IP pengguna dikirim ke third-party tanpa consent

**File:** [`app/components/VisitorNotifier.tsx`](file:///c:/project/PlanetKit/app/components/VisitorNotifier.tsx#L10-L25)

```ts
const ipRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
// ...
await fetch("/api/notify-visitor", { body: JSON.stringify({ ip, location }) });
```

**Masalah:** Komponen ini secara otomatis:
1. Mengirim IP pengguna ke third-party service `ipapi.co`
2. Meneruskan IP + lokasi ke server melalui Telegram

Tanpa informasi consent/privacy policy yang jelas, ini berpotensi melanggar GDPR/regulasi privasi.

---

### 🟡 BUG-032 — `FileUploader.tsx`: Validasi ukuran tidak dilakukan saat drop (mixed files)

**File:** [`app/components/FileUploader.tsx`](file:///c:/project/PlanetKit/app/components/FileUploader.tsx#L48-L59)

```ts
if (allFiles.length > 0 && dropped.length === 0) {
  setError(`${t.invalidFile} ${exts}`);
  return;
}

const oversized = dropped.find((f) => f.size > maxSize);
```

**Masalah:** Jika pengguna drag-drop campuran file valid dan invalid, hanya file yang valid (sesuai ekstensi) yang diproses, tapi tidak ada pesan bahwa sebagian file di-reject. Pengguna tidak tahu bahwa beberapa filenya tidak diproses.

---

## 9. Tools — Lainnya

### 🟠 BUG-033 — `social-downloader/page.tsx`: API endpoint `/api/download/${platform}` tidak ada di codebase

**File:** [`app/tools/social-downloader/page.tsx`](file:///c:/project/PlanetKit/app/tools/social-downloader/page.tsx#L51)

```ts
const res = await fetch(`/api/download/${platform}`, { ... });
```

**Masalah:** Tidak ada file `app/api/download/instagram/route.ts`, `twitter/route.ts`, atau `tiktok/route.ts` di project (hanya ada `terabox`). Semua permintaan social download akan selalu gagal dengan 404.

---

### 🟠 BUG-034 — `terabox-downloader/page.tsx`: URL parsing `surl` rapuh

**File:** [`app/tools/terabox-downloader/page.tsx`](file:///c:/project/PlanetKit/app/tools/terabox-downloader/page.tsx#L97)

```ts
const surl = url.match(/surl=([^&]+)/)?.[1] || "";
```

**Masalah:** Jika URL format-nya adalah `https://terabox.com/s/XXXX` (shortlink tanpa parameter `surl=`), regex ini gagal mengekstrak kode. `surl` akan menjadi string kosong dan link TeraBox yang dihasilkan rusak. Format URL ini cukup umum.

---

### 🟡 BUG-035 — `social-downloader/page.tsx`: `downloadFile` selalu gagal untuk cross-origin URLs

**File:** [`app/tools/social-downloader/page.tsx`](file:///c:/project/PlanetKit/app/tools/social-downloader/page.tsx#L72-L87)

```ts
const downloadFile = async (mediaUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = mediaUrl;
  a.download = filename;  // ← tidak akan trigger download untuk cross-origin
  a.target = "_blank";
  a.click();
};
```

**Masalah:** Attribute `download` pada `<a>` tag **hanya berfungsi untuk same-origin URLs**. Untuk CDN Instagram/TikTok (cross-origin), browser akan mengabaikan `download` attribute dan hanya membuka URL di tab baru. Pengguna tidak akan mendapat file ter-download.

**Fix:** Fetch blob dulu via proxy server, lalu buat object URL untuk download.

---

### 🟡 BUG-036 — `image-to-text/page.tsx`: Progress tidak akurat — menampilkan 100% sebelum OCR selesai

**File:** [`app/tools/image-to-text/page.tsx`](file:///c:/project/PlanetKit/app/tools/image-to-text/page.tsx#L43-L44)

```ts
for (let i = 0; i < files.length; i++) {
  setProgress(((i + 1) / files.length) * 100);  // ← set 100% sebelum OCR selesai
  const result = await Tesseract.recognize(files[i], "eng", { ... });
```

**Masalah:** Progress di-set ke `((i+1)/total)*100` **sebelum** `Tesseract.recognize` dipanggil, bukan setelah. Untuk 1 file, progress langsung 100% bahkan sebelum OCR mulai. Progress yang lebih detail sudah ada di dalam logger callback tapi overwrite oleh nilai ini.

---

## 10. Bug Tambahan dari API Routes (Deep Scan)

### 🔴 BUG-037 — `api/canva-link/route.ts` GET: Mengekspos Canva invite link ke publik tanpa autentikasi

**File:** [`app/api/canva-link/route.ts`](file:///c:/project/PlanetKit/app/api/canva-link/route.ts#L3-L9)

```ts
export async function GET() {
  const link = process.env.CANVA_INVITE_LINK;
  return NextResponse.json({ link });  // ← siapapun bisa akses!
}
```

**Masalah:** Siapapun bisa memanggil `/api/canva-link` dan mendapatkan link undangan Canva premium tanpa autentikasi apapun.

---

### 🔴 BUG-038 — `api/remove-bg/route.ts`: Tidak ada validasi file yang diterima

**File:** [`app/api/remove-bg/route.ts`](file:///c:/project/PlanetKit/app/api/remove-bg/route.ts#L7-L14)

```ts
const formData = await request.formData();
const res = await fetch(REMOVEBG_API, { body: formData });
```

**Masalah:** Seluruh `formData` diteruskan ke remove.bg tanpa validasi. Tidak ada cek MIME type, tidak ada size limit, tidak ada verifikasi field `image_file` ada. Bisa dipakai untuk forward request berbahaya.

---

### 🟠 BUG-039 — `api/credits/route.ts`: Mapping field API remove.bg salah → kredit selalu tampil keliru

**File:** [`app/api/credits/route.ts`](file:///c:/project/PlanetKit/app/api/credits/route.ts#L17-L18)

```ts
const total = attrs.api?.free_calls ?? 50;    // free_calls ≠ total quota
const elapsed = attrs.credits?.total ?? 0;   // total credits = sisa, bukan terpakai!
```

**Masalah:** `attrs.credits?.total` di remove.bg API adalah **sisa kredit** (remaining), bukan "yang sudah dipakai". Jadi `remaining: total - elapsed` selalu menghasilkan nilai negatif atau tidak logis.

---

### 🟠 BUG-040 — `api/notify-visitor/route.ts`: Internal error Telegram dikirim ke client

**File:** [`app/api/notify-visitor/route.ts`](file:///c:/project/PlanetKit/app/api/notify-visitor/route.ts#L35)

```ts
return NextResponse.json({ error: "Telegram send failed", detail: String(e) }, { status: 500 });
```

**Masalah:** Error detail dari Telegram (termasuk potensi bot token fragments) dikirim ke client. Information disclosure.

---

### 🟠 BUG-041 — `app/lib/supabase.ts`: Singleton server-side bisa menyebabkan session bleed

**Masalah:** Singleton `supabase` yang dibuat di module level dipakai di semua server requests secara concurrent. Jika auth state di-manage via singleton, state satu request bisa bleed ke request lain.

---

### 🟡 BUG-042 — `package.json`: Script `analyze` tidak berfungsi di Windows

**File:** [`package.json`](file:///c:/project/PlanetKit/package.json#L10)

```json
"analyze": "ANALYZE=true next build"
```

**Masalah:** `ANALYZE=true` adalah sintaks Unix shell. Di Windows (OS yang digunakan proyek ini), perintah ini gagal karena `ANALYZE` tidak dikenali sebagai perintah. 

**Fix:** Gunakan `cross-env`: `"analyze": "cross-env ANALYZE=true next build"`

---

### 🟡 BUG-043 — `package.json`: `puppeteer` ada di production dependencies (~300MB bloat)

**File:** [`package.json`](file:///c:/project/PlanetKit/package.json#L33-L35)

```json
"puppeteer": "^25.3.0",
"puppeteer-extra": "^3.3.6",
"puppeteer-extra-plugin-stealth": "^2.11.2"
```

**Masalah:** Puppeteer membundle Chromium (~300MB). Sebagai production dependency, ini akan diinstall di setiap deployment, memperbesar ukuran dan memperlambat cold-start.

---

### 🟡 BUG-044 — `next.config.ts`: Tidak ada Content-Security-Policy header

**File:** [`next.config.ts`](file:///c:/project/PlanetKit/next.config.ts#L11-L19)

**Masalah:** Security headers yang ada tidak menyertakan `Content-Security-Policy` — header paling penting untuk mitigasi XSS. Tanpa CSP, XSS vulnerability manapun punya akses penuh ke DOM.

---

### 🟢 BUG-045 — `package.json`: `@types/cheerio` dan `@types/highlight.js` sudah obsolete

**Masalah:** Kedua package ini deprecated karena tipe sudah di-bundle langsung ke package utamanya sejak cheerio v1+ dan highlight.js v10+. Hanya menambah bloat dan bisa menyebabkan konflik tipe.

---

## 11. Ringkasan

| Severity | Jumlah | Bug IDs |
|----------|--------|---------|
| 🔴 Critical | 2 | BUG-001, BUG-008 |
| 🟠 High | 11 | BUG-002, BUG-005, BUG-009, BUG-010, BUG-011, BUG-012, BUG-016, BUG-021, BUG-026, BUG-027, BUG-033 |
| 🟡 Medium | 23 | BUG-003 s/d BUG-007, BUG-013 s/d BUG-015, BUG-017 s/d BUG-020, BUG-022 s/d BUG-025, BUG-028 s/d BUG-032, BUG-034 s/d BUG-036 |
| **Total** | **36** | |

---

## 11. Prioritas Perbaikan

### Segera (Blok Fungsionalitas)
1. **BUG-001** — Build crash tanpa env vars
2. **BUG-033** — Social downloader API tidak ada
3. **BUG-008** — MD5/enkripsi PDF rusak
4. **BUG-012** — "Decrypt PDF" merusak kualitas dokumen

### Penting (Keamanan & Logic Error)
5. **BUG-021** — ReDoS pada regex tester
6. **BUG-004** — iframe sandbox bypass (XSS)
7. **BUG-026** — Formula profit calculator salah
8. **BUG-009** — Enkripsi PDF menggunakan Math.random
9. **BUG-005** — IP tracking bisa dimanipulasi

### Perlu Perbaikan
10. **BUG-016** — OCR hanya bahasa Inggris
11. **BUG-017** — Double fetch credits
12. **BUG-029** — Blank screen saat loading bahasa
13. **BUG-035** — Download cross-origin tidak berfungsi
