"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/app/lib/i18n/context";

interface PdfPreviewProps {
  file: File;
  pageIndex: number;
  width?: number;
  className?: string;
}

export default function PdfPreview({
  file,
  pageIndex,
  width = 200,
  className = "",
}: PdfPreviewProps) {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(pageIndex + 1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch {
        if (!cancelled) setError(t.previewFailed);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [file, pageIndex, width, t.previewFailed]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-surface text-xs text-text-secondary ${className}`}
        style={{ width, height: width * 1.4 }}
      >
        {error}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg bg-white ${className}`}
      style={{ width }}
    />
  );
}
