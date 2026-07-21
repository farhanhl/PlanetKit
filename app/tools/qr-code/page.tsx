"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import { useLang } from "@/app/lib/i18n/context";

type OutputFormat = "png" | "svg";

export default function QrCodePage() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [darkColor, setDarkColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderQr = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, size, size);
          }
        }
        setSvgHtml("");
        return;
      }

      try {
        if (format === "png" && canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: { dark: darkColor, light: "#FFFFFF" },
          });
        } else if (format === "svg") {
          const svg = await QRCode.toString(value, {
            type: "svg",
            width: size,
            margin: 2,
            color: { dark: darkColor, light: "#FFFFFF" },
          });
          setSvgHtml(svg);
        }
      } catch {
        // invalid input, ignore
      }
    },
    [size, format, darkColor]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => renderQr(text), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, renderQr]);

  const download = async () => {
    if (!text.trim()) return;

    try {
      if (format === "png") {
        const dataUrl = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          color: { dark: darkColor, light: "#FFFFFF" },
        });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qrcode.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const svg = await QRCode.toString(text, {
          type: "svg",
          width: size,
          margin: 2,
          color: { dark: darkColor, light: "#FFFFFF" },
        });
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qrcode.svg";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch {
      // download failed silently
    }
  };

  return (
    <ToolPageLayout
      title={t.qrCodeTitle}
      description={t.qrCodeDesc}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <label className="mb-1 block text-xs text-text-secondary">
              {t.textOrUrl}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.qrPlaceholder}
              rows={4}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
            />

            <div className="flex items-center justify-center rounded-xl border border-border bg-background p-8">
              {text.trim() ? (
                format === "png" ? (
                  <canvas ref={canvasRef} className="rounded-lg" />
                ) : (
                  <div
                    ref={svgRef}
                    className="flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 text-text-secondary">
                  <QrCode className="h-16 w-16 opacity-30" />
                  <p className="text-sm">{t.qrEmpty}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.qrSettings}</h3>

            <label className="mb-1 block text-xs text-text-secondary">{t.format}</label>
            <div className="mb-4 flex gap-2">
              {(["png", "svg"] as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    format === f
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs text-text-secondary">{t.size}: {size}px</label>
            <input
              type="range"
              min={128}
              max={512}
              step={32}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="mb-4 w-full accent-[var(--accent)]"
            />

            <label className="mb-1 block text-xs text-text-secondary">{t.darkColor}</label>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <button
              onClick={download}
              disabled={!text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {t.download(format.toUpperCase())}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
