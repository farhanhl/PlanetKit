# PlanetKit — Project Rules

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| PDF Read | pdfjs-dist v6 |
| PDF Write | pdf-lib |
| DOCX Read | mammoth |
| DOCX Write | docx |
| PPT Write | pptxgenjs |
| HTML→PDF | html2canvas-pro + jspdf |
| Spreadsheet | xlsx |
| OCR | tesseract.js |
| Markdown | markdown-it |
| Icons | lucide-react |
| Packaging | jszip |
| Testing | vitest |
| Analytics | Supabase (PostgreSQL) |
| QR Code | qrcode |
| HTML Parser | cheerio |

## Project Structure

```
app/
├── layout.tsx                  # Root layout (Navbar + Footer + metadata/SEO)
├── page.tsx                    # Landing page (tabbed categories)
├── not-found.tsx               # Custom 404 page
├── globals.css                 # Design tokens + Tailwind
├── lib/
│   ├── i18n/
│   │   ├── context.tsx         # LanguageContext + provider
│   │   ├── en.ts               # English translations
│   │   └── id.ts               # Indonesian translations
│   └── supabase.ts             # Supabase client singleton
├── components/
│   ├── Providers.tsx           # Client wrapper (LanguageProvider)
│   ├── Navbar.tsx              # Logo + language switcher dropdown
│   ├── Footer.tsx
│   ├── FileUploader.tsx        # Drag & drop + file list + validation
│   ├── PdfPreview.tsx          # PDF page thumbnail (canvas)
│   ├── ImagePreview.tsx        # Image thumbnail (objectURL)
│   ├── ProgressBar.tsx         # Processing progress
│   ├── ToolCard.tsx            # Landing page card
│   ├── ToolPageLayout.tsx      # Shared tool page wrapper
│   ├── ToolSeo.tsx             # Per-tool SEO metadata
│   ├── AnalyticsTracker.tsx    # Tool visit tracking (auto-included in ToolPageLayout)
│   ├── ShareButton.tsx         # Share functionality
│   └── VisitorNotifier.tsx     # Visitor notification
├── admin/
│   └── analytics/page.tsx      # Admin analytics dashboard (password-protected)
├── api/                        # Server-side API routes
│   ├── download/               # Social media downloader
│   ├── analytics/              # Analytics tracking
│   │   ├── track/route.ts      # POST — log visit (rate-limited)
│   │   ├── stats/route.ts      # GET — aggregated stats (admin auth)
│   │   └── popular/route.ts    # GET — public top tools by usage
│   ├── canva-link/             # Canva link handling
│   ├── credits/                # Credits API
│   ├── notify-visitor/         # Visitor notification
│   └── remove-bg/              # Background removal proxy
└── tools/                      # 54 tool pages (one folder per tool)
    ├── loading.tsx             # Shared loading skeleton
    └── [tool-name]/page.tsx    # Each tool is a client component
```

## API Routes

```
app/api/download/       # Social media: instagram, twitter, tiktok
app/api/analytics/      # Tool usage analytics
├── track/route.ts      # POST — log visit (rate-limited: 1 per IP per tool per 5 min)
├── stats/route.ts      # GET — aggregated stats (admin auth via x-analytics-password header)
└── popular/route.ts    # GET — public, returns top tools sorted by visit count
app/api/canva-link/     # Canva link handling
app/api/credits/        # Credits API
app/api/notify-visitor/ # Visitor notification (Telegram)
app/api/remove-bg/      # Background removal proxy
```

## Analytics

Supabase-based tool usage tracking. `AnalyticsTracker` component is auto-included in `ToolPageLayout` — all tools are tracked automatically.

### Supabase Table

```sql
CREATE TABLE tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tool_usage_slug ON tool_usage(tool_slug);
CREATE INDEX idx_tool_usage_created_at ON tool_usage(created_at DESC);
```

### How It Works

1. User visits `/tools/xyz` → `ToolPageLayout` renders → `AnalyticsTracker` fires
2. `AnalyticsTracker` extracts slug from `usePathname()` → POSTs to `/api/analytics/track`
3. API route rate-limits (1 per IP per slug per 5 min) → inserts into Supabase
4. Landing page fetches `/api/analytics/popular` → shows "Populer" sort button
5. Admin views `/admin/analytics` → fetches from `/api/analytics/stats` → sorted table

### Env Vars

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ANALYTICS_PASSWORD=your-admin-password
```

### Admin Access

Navigate to `/admin/analytics`, enter password. Shows: tool slug, total visits, unique visitors, sorted by frequency.

- Social media routes use `cheerio` for HTML parsing
- Fetches social media pages server-side (avoids CORS)
- Returns media URLs as JSON

## Routing Rules

- Files in `app/tools/[name]/page.tsx` → route `/tools/[name]`
- No nested folders like `app/tools/pdf/[name]/` — keep routes flat
- Links in Navbar and Landing must match actual file routes exactly

## Component Rules

### Client vs Server Components

- Only add `"use client"` when the component uses hooks, state, or browser APIs
- Components like `ToolCard`, `ToolPageLayout`, `Footer` are server components by default
- All tool pages are client components (need state + browser APIs)

### Reusable Components

All tool pages must use shared components for consistent UI:

- `ToolPageLayout` — wraps every tool page (back link, title, description)
- `FileUploader` — all file upload interactions (drag & drop, file list, remove)
- `ProgressBar` — all processing progress display
- `PdfPreview` — PDF page thumbnail rendering
- `ImagePreview` — image thumbnail rendering
- `ToolSeo` — per-tool SEO metadata (title, description, path)

### FileUploader Usage

```tsx
<FileUploader
  accept=".pdf"                    // Required: file extensions
  multiple                         // Optional: multi-file
  label="Drop files here"          // Optional: heading text
  description="or click to browse" // Optional: subtext
  onFiles={handleFiles}            // Required: callback
  files={files}                    // Optional: show file list
  onRemove={removeFile}            Optional: remove callback
/>
```

- Validates file extensions on drop — shows error message for wrong types
- Uses drag counter for stable drag state (no flicker)

## Design System

### Color Tokens (CSS variables in globals.css)

| Token | Usage | Value |
|-------|-------|-------|
| `--background` | Page bg | `#0B1120` |
| `--surface` | Cards, inputs | `#131C31` |
| `--surface-hover` | Hover states | `#1A2540` |
| `--border` | Borders | `#1E2D4A` |
| `--accent` | Primary action | `#D4A853` |
| `--accent-hover` | Accent hover | `#E4BC6A` |
| `--foreground` | Primary text | `#E8ECF4` |
| `--text-secondary` | Muted text | `#7B8BA5` |
| `--success` | Success states | `#34D399` |
| `--error` | Error states | `#F87171` |

### Fonts

- Body: Inter (`--font-inter`)
- Mono: JetBrains Mono (`--font-jetbrains`)

### Tailwind Usage

Use Tailwind utility classes directly. Reference tokens via:
- `bg-background`, `bg-surface`, `bg-surface-hover`
- `text-foreground`, `text-text-secondary`, `text-accent`, `text-error`
- `border-border`, `border-accent`
- `font-sans` (Inter), `font-mono` (JetBrains)

## PDF Processing Rules

### pdfjs-dist Worker

```tsx
// Always single import pattern:
const pdfjs = await import("pdfjs-dist");
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

- Never do double dynamic imports of pdfjs-dist
- Worker loads from CDN (unpkg) — requires internet

### Dynamic Import for Browser-Only Libraries

`pdf-lib` uses browser-only APIs (`DOMMatrix`, etc.). It MUST
be dynamically imported inside functions, never at the top level. Top-level
import causes `DOMMatrix is not defined` during Next.js server-side prerender.

```tsx
// WRONG — crashes on Vercel build:
import { PDFDocument } from "pdf-lib";
const pdf = await PDFDocument.create();

// CORRECT — only loads on client when called:
const { PDFDocument } = await import("pdf-lib");
const pdf = await PDFDocument.create();
```

Apply dynamic import to: `pdf-lib`, `mammoth`, `html2canvas-pro`, `jspdf`

`jszip` works fine with top-level import (`import JSZip from "jszip"`) — no DOM dependency.
`pdfjs-dist` is already dynamic — keep it that way.
`docx` is safe to import dynamically inside functions.

### JSZip Instantiation

```tsx
// WRONG — zip.file is not a function:
const zip = (await import("jszip")).default;
zip.file("test.txt", data);  // TypeError!

// CORRECT — must instantiate:
const JSZip = (await import("jszip")).default;
const zip = new JSZip();
zip.file("test.txt", data);  // works
```

- `(await import("jszip")).default` returns the **constructor**, not an instance
- Always call `new JSZip()` before using `.file()` or `.generateAsync()`

### Text Extraction (pdfjs-dist)

```tsx
const content = await page.getTextContent();
const text = content.items
  .filter((item): item is { str: string } & typeof item => "str" in item)
  .map((item) => item.str)
  .join(" ");
```

- `TextItem` union includes `TextMarkedContent` (no `str`) — always filter first

### pdf-lib Usage

- `embedPng()` for PNG images
- `embedJpg()` for JPG/JPEG images only
- Do NOT pass WebP to `embedJpg` — it will crash
- Rotation: use `page.setRotation(degrees(angle))`, NOT `page.setRotate()`
- Import `degrees` from `pdf-lib` alongside `PDFDocument`
- `pdf.save({ useObjectStreams: true })` for compression
- `PDFDocument.load(buffer, { ignoreEncryption: true })` to skip encryption check
- Wrap all PDF operations in try/catch

### File Downloads

```tsx
// Always use setTimeout for revokeObjectURL:
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "filename.ext";
a.click();
setTimeout(() => URL.revokeObjectURL(url), 100);
```

- Never call `revokeObjectURL` synchronously after `.click()`

## Error Handling Rules

### Tool Pages

Every `convert`, `merge`, or async operation must:

1. Set `error` state to `null` at start
2. Wrap in `try/catch`
3. Set descriptive error message on catch
4. Use `finally` to reset `processing` state
5. Display error in UI with `border-error/30 bg-error/5` styling

```tsx
try {
  // ... operation
} catch {
  setError("Descriptive error message");
} finally {
  setProcessing(false);
  setProgress(0);
}
```

### FileUploader Async Callbacks

If `onFiles` callback is async (e.g., merge-pdf needs to read PDF metadata), wrap the body in try/catch to prevent unhandled promise rejections.

## Performance Rules

- Never parse the same PDF file twice — cache parsed documents
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed as props
- Revoke blob URLs in `useEffect` cleanup (ImagePreview)
- Only show preview thumbnails when files exist

## Responsive Design

- All tool pages use responsive grid: `grid gap-6 lg:grid-cols-3`
- Tool settings sidebar: full width on mobile, sidebar on `lg:`
- Landing page tabbed grid: `grid-cols-2 lg:grid-cols-4`
- Tab bar: `overflow-x-auto flex gap-2` (scrollable on mobile)
- FileUploader: `p-8 sm:p-12`
- Preview grids: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5` (pdf)
- Preview grids: `grid-cols-2 sm:grid-cols-3` (images)

## SEO & Metadata

- Root layout defines `title` with template: `%s | PlanetKit`
- Includes `description`, `keywords`, `openGraph`, `twitter` cards
- Tool pages use `<ToolSeo>` component for per-page SEO

## Security

- `next.config.ts` adds security headers: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy
- `app/not-found.tsx` provides custom 404 page

## Internationalization (i18n)

Client-side i18n via React Context. Two languages: English (`en`) and Indonesian (`id`).

### Files

- `app/lib/i18n/en.ts` — English translations (~250 keys)
- `app/lib/i18n/id.ts` — Indonesian translations (same structure)
- `app/lib/i18n/context.tsx` — `LanguageProvider` + `useLang()` hook
- `app/components/Providers.tsx` — Client wrapper (needed because layout is server component)

### Usage

```tsx
import { useLang } from "@/app/lib/i18n/context";

function MyComponent() {
  const { t, lang, toggle } = useLang();
  return <h1>{t.someKey}</h1>;
}
```

### Rules

- Always use `t.keyName` for user-facing strings — never hardcode
- For dynamic strings, use functions: `t.pagesCount(n)`, `t.convertingPage(name, i, total)`
- Language persists in `localStorage` (`planet-lang` key)
- Tool card objects: `t.toolName.title` and `t.toolName.desc` (nested)
- All components using `useLang` must be client components (`"use client"`)
- `Providers.tsx` wraps children in `LanguageProvider` inside `layout.tsx`

## Lint Rules

Run before commit:

```bash
npm run lint
npm run test
npm run build
```

All three must pass with zero errors.

## Testing

Uses **vitest** (Node.js, no browser). Tests live next to their tool:

```
app/tools/split-pdf/split-pdf.test.ts
app/tools/merge-pdf/merge-pdf.test.ts
app/tools/compress-pdf/compress-pdf.test.ts
app/tools/csv-to-excel/csv-to-excel.test.ts
app/tools/excel-to-csv/excel-to-csv.test.ts
app/tools/image-to-pdf/image-to-pdf.test.ts
app/tools/compress-image/compress-image.test.ts
app/tools/ppt-to-pdf/ppt-to-pdf.test.ts
app/tools/text-to-pdf/text-to-pdf.test.ts
app/tools/json-formatter/json-formatter.test.ts
app/tools/pdf-to-image/pdf-to-image.test.ts
app/tools/pdf-to-docx/pdf-to-docx.test.ts
app/tools/pdf-to-excel/pdf-to-excel.test.ts
app/tools/pdf-to-ppt/pdf-to-ppt.test.ts
app/tools/pdf-encrypt/pdf-encrypt.test.ts
app/tools/word-counter/word-counter.test.ts
```

### What to test

- **Import patterns** — verify `jszip` is instantiated with `new JSZip()`, not used as constructor directly. This catches the bug class where `const zip = (await import("jszip")).default` is used without `new`.
- **Pure logic** — `parseRange`, `formatSize`, text grouping by Y-coordinate, extension renaming.
- **Library operations** — pdf-lib merge/split/compress, xlsx read/write roundtrips, jszip create/load/read.
- **Not tested** — canvas rendering, DOM APIs (`DOMParser`, `DOMMatrix`, `Image`, `toBlob`), OCR. These need a browser environment.

### Commands

```bash
npm test          # single run
npm run test:watch # watch mode
```

### Adding tests for new tools

When adding a new tool, write a `.test.ts` file next to `page.tsx` that verifies:
1. The tool's key library imports correctly
2. Any pure logic functions work
3. The import/instantiation pattern is correct (especially jszip)
