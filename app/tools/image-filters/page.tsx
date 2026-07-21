"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCcw } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

type FilterType = "none" | "grayscale" | "sepia" | "blur" | "brightness" | "contrast" | "invert" | "saturate" | "hue-rotate";

const filters: { key: FilterType; labelKey: string }[] = [
  { key: "none", labelKey: "imgFilterNone" },
  { key: "grayscale", labelKey: "imgFilterGrayscale" },
  { key: "sepia", labelKey: "imgFilterSepia" },
  { key: "blur", labelKey: "imgFilterBlur" },
  { key: "brightness", labelKey: "imgFilterBrightness" },
  { key: "contrast", labelKey: "imgFilterContrast" },
  { key: "invert", labelKey: "imgFilterInvert" },
  { key: "saturate", labelKey: "imgFilterSaturate" },
  { key: "hue-rotate", labelKey: "imgFilterHueRotate" },
];

function getFilterCSS(type: FilterType, value: number): string {
  switch (type) {
    case "grayscale": return `grayscale(${value}%)`;
    case "sepia": return `sepia(${value}%)`;
    case "blur": return `blur(${Math.round(value / 10)}px)`;
    case "brightness": return `brightness(${50 + value}%)`;
    case "contrast": return `contrast(${50 + value}%)`;
    case "invert": return `invert(${value}%)`;
    case "saturate": return `saturate(${value}%)`;
    case "hue-rotate": return `hue-rotate(${value * 3.6}deg)`;
    default: return "none";
  }
}

export default function ImageFiltersPage() {
  const { t } = useLang();
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [filter, setFilter] = useState<FilterType>("none");
  const [value, setValue] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setFilter("none");
    setValue(50);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.filter = "none";
          ctx.drawImage(img, 0, 0);
        }
        setImage(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const applyFilter = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getFilterCSS(filter, value);
    ctx.drawImage(img, 0, 0);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyFilter();
    const link = document.createElement("a");
    link.download = fileName || "filtered.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const reset = () => {
    setFilter("none");
    setValue(50);
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (canvas && img) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(img, 0, 0);
    }
  };

  return (
    <>
      <ToolSeo title={t.imgFilterTitle} description={t.imgFilterDesc} path="/tools/image-filters" />
      <ToolPageLayout title={t.imgFilterTitle} description={t.imgFilterDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!image ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/40"
              >
                <Upload className="mb-3 h-10 w-10 text-text-secondary/40" />
                <p className="text-sm font-medium text-foreground">{t.imgFilterDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.imgFilterDropDesc}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <canvas
                  ref={canvasRef}
                  className="max-h-[400px] w-full rounded-lg object-contain"
                  style={{ filter: getFilterCSS(filter, value) }}
                />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.imgFilterSettings}</h3>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      filter === f.key
                        ? "bg-accent/10 text-accent border border-accent/30"
                        : "border border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {t[f.labelKey as keyof typeof t] as string}
                  </button>
                ))}
              </div>

              {filter !== "none" && filter !== "grayscale" && filter !== "invert" && (
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                    <span>{t.imgFilterIntensity}</span>
                    <span>{value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              )}

              <div className="space-y-2">
                {image && (
                  <button
                    onClick={download}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
                  >
                    <Download className="h-4 w-4" />
                    {t.imgFilterDownload}
                  </button>
                )}
                {image && filter !== "none" && (
                  <button
                    onClick={reset}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t.imgFilterReset}
                  </button>
                )}
                {image && (
                  <button
                    onClick={() => { setImage(null); setFileName(""); setFilter("none"); setValue(50); }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {t.change}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
