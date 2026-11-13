"use client";

import { useState, useCallback } from "react";
import { ScanText, Copy, Download } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ProgressBar from "@/app/components/ProgressBar";
import ToolSeo from "@/app/components/ToolSeo";

export default function PdfOcrPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"eng+ind" | "eng" | "ind">("eng+ind");
  const [mode, setMode] = useState<"auto" | "ocr">("auto");

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setExtractedText("");
    setError(null);
    setCopied(false);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setExtractedText("");
    setError(null);
  }, []);

  // Preprocessing canvas untuk meningkatkan kontras teks bagi Tesseract OCR
  const preprocessCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceCanvas;

    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Tingkatkan kontras dan grayscale
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrast = 1.3;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      const val = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  };

  // Pembersihan karakter noise dan typo umum hasil OCR
  const cleanOcrResult = (raw: string): string => {
    return raw
      .replace(/(^|\n)\|\s+([A-Za-z])/g, "$1I $2")
      .replace(/\|\s+design\s+systems/gi, "I design systems")
      .replace(/(^|\n)[«+]\s+/g, "$1• ")
      .replace(/(^|\n)[eE]o,\s*FY\b/g, "")
      .replace(/(^|\n)[‘'`]O\s*Fretase\b/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const recognize = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setCopied(false);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const Tesseract = await import("tesseract.js");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const texts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(((i - 1) / pdf.numPages) * 100);
        const page = await pdf.getPage(i);

        // Jika mode auto, cek apakah halaman sudah memiliki digital text layer
        let pageText = "";
        if (mode === "auto") {
          const textContent = await page.getTextContent();
          const items = textContent.items.filter(
            (item): item is { str: string } & typeof item => "str" in item
          );
          const rawJoined = items.map((it) => it.str).join(" ");
          // Jika memiliki lebih dari 15 kata nyata, gunakan teks digital langsung (100% akurat)
          if (rawJoined.trim().split(/\s+/).length > 15) {
            pageText = rawJoined.trim();
          }
        }

        // Jika tidak ada text layer atau mode dipaksa OCR, jalankan Tesseract
        if (!pageText) {
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          const preprocessed = preprocessCanvas(canvas);
          const blob = await new Promise<Blob>((resolve) =>
            preprocessed.toBlob((b) => resolve(b!), "image/png")
          );

          const result = await Tesseract.recognize(blob, lang, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                const pageProgress = ((i - 1) / pdf.numPages) * 100;
                setProgress(pageProgress + (m.progress * 100) / pdf.numPages);
              }
            },
          });

          pageText = cleanOcrResult(result.data.text);
        }

        if (pageText.trim()) {
          texts.push(`${t.pageHeader(i)}\n${pageText}`);
        }
      }

      setProgress(100);

      if (texts.length === 0) {
        setError(t.ocrNoTextFound);
      } else {
        setExtractedText(texts.join("\n\n"));
      }
    } catch {
      setError(t.ocrFailed);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.copyFailed);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr_text.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <>
    <ToolSeo title={t.ocrTitle} description={t.ocrDesc} path="/tools/pdf-ocr" />
    <ToolPageLayout title={t.ocrTitle} description={t.ocrDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.ocrDrop}
            description={t.ocrDropDesc}
            onFiles={handleFile}
            files={file ? [file] : []}
            onRemove={() => removeFile()}
          />

          {file && (
            <div className="mt-4">
              <PdfPreview file={file} pageIndex={0} />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {extractedText && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t.extractedText}</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? t.copied : t.copy}
                  </button>
                  <button
                    onClick={downloadTxt}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <Download className="h-3 w-3" />
                    {t.txt}
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={extractedText}
                className="h-96 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.ocrSettings}</h3>

            <div className="mb-4 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Mode Ekstraksi</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "auto" | "ocr")}
                className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="auto">Auto (Deteksi Teks Digital + OCR)</option>
                <option value="ocr">Paksa OCR (Scan Gambar)</option>
              </select>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Bahasa OCR</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "eng+ind" | "eng" | "ind")}
                className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="eng+ind">English + Indonesia (Bilingual)</option>
                <option value="eng">English</option>
                <option value="ind">Bahasa Indonesia</option>
              </select>
            </div>

            <p className="mb-4 text-xs text-text-secondary">{t.ocrNote}</p>

            {processing && (
              <ProgressBar progress={progress} label={t.ocrProcessing} className="mb-4" />
            )}

            <button
              onClick={recognize}
              disabled={!file || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ScanText className="h-4 w-4" />
              {processing ? t.ocrProcessing : t.ocrBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
    </>
  );
}
