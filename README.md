<div align="center">

# 🪐 PlanetKit

**Free Browser-Based File & Developer Tools**

Convert, merge, split, and compress PDFs, generate QR codes, and format data locally in your browser without uploading files to a server.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)

[Live Demo](https://planetkit.vercel.app) · [Report Bug](https://github.com/farhanhl/planet-tools/issues) · [Request Feature](https://github.com/farhanhl/planet-tools/issues)

</div>

---

## Features

| Category | Tools |
|----------|-------|
| **Convert** | PDF ↔ Image, PDF ↔ DOCX, PDF ↔ Excel, PDF ↔ PPT, HTML → PDF, Markdown → PDF, Text → PDF, Image OCR, SVG → PNG, CSV ↔ Excel |
| **Edit** | Merge PDF, Split PDF, Rotate PDF, Reorder Pages, Delete Pages, Encrypt PDF |
| **Enhance** | Page Numbers, Watermark, Header/Footer, Crop PDF, Resize PDF, Sign PDF, Remove Background, Image Resize, PDF Flatten, PDF Background |
| **Optimize** | Compress PDF, Compress Image |
| **Download** | Social Downloader (Instagram, TikTok, Twitter), Canva Premium Link |
| **Utilities** | QR Code, Base64, Hash Generator, Password Generator, Color Picker/Converter, URL Encoder, JSON Formatter, Timestamp Converter, Regex Tester, PDF Metadata, PDF Compare, Word Counter |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI:** [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com)
- **Language:** [TypeScript](https://typescriptlang.org)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL)
- **Icons:** [Lucide React](https://lucide.dev)

### Client-side Libraries

| Library | Purpose |
|---------|---------|
| `pdf-lib` | PDF manipulation (merge, split, rotate, encrypt) |
| `pdfjs-dist` | PDF rendering and text extraction |
| `tesseract.js` | OCR (optical character recognition) |
| `jszip` | ZIP file handling |
| `xlsx` | Excel/CSV parsing |
| `mammoth` | DOCX to HTML conversion |
| `html2canvas-pro` | HTML to canvas capture |
| `jspdf` | PDF generation from HTML |
| `docx` | DOCX generation |
| `pptxgenjs` | PowerPoint generation |
| `qrcode` | QR code generation |

> All libraries are lazy-loaded via dynamic imports for optimal bundle size.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (for analytics)
- A [remove.bg](https://remove.bg) API key (for background removal tool)

### Installation

```bash
git clone https://github.com/farhanhl/planet-tools.git
cd planetkit
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
REMOVEBG_API_KEY=your_removebg_api_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

### Bundle Analysis

```bash
npm run analyze
```

## Project Structure

```
planetkit/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers, SEO)
│   ├── page.tsx                # Homepage (tool directory)
│   ├── globals.css             # Tailwind v4 + CSS variables
│   ├── components/             # Shared components
│   ├── lib/
│   │   ├── i18n/               # English & Indonesian translations
│   │   └── supabase.ts         # Supabase client
│   ├── tools/                  # 54 tool pages
│   └── api/                    # API routes (analytics, proxies)
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
└── package.json
```

## Key Features

- **Client-Side Processing:** Files are processed entirely in memory inside the browser with zero server uploads.
- **Lazy Loading** — Heavy libraries (pdf-lib, tesseract.js, etc.) are loaded on-demand per tool.
- **i18n** — English and Indonesian language support.
- **Dark/Light Theme** — Automatic theme detection with manual toggle.
- **Mobile Responsive** — Works on all screen sizes.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE).
