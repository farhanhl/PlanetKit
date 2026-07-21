"use client";

import { useState, useRef, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function ColorPickerPage() {
  const { t } = useLang();
  const [color, setColor] = useState("#D4A853");
  const [copied, setCopied] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
    setColor(hex);
  };

  const copyValue = async (val: string, label: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  };

  const rgb = hexToRgb(color);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  return (
    <>
      <ToolSeo title={t.colorPickerTitle} description={t.colorPickerDesc} path="/tools/color-picker" />
      <ToolPageLayout title={t.colorPickerTitle} description={t.colorPickerDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-text-secondary">{t.uploadImage}</label>
              <input type="file" accept="image/*" onChange={handleImage} className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20" />
            </div>
            {imgLoaded && (
              <div className="overflow-hidden rounded-xl border border-border">
                <canvas ref={canvasRef} onClick={pickColor} className="max-h-96 w-full cursor-crosshair object-contain" />
              </div>
            )}
            {!imgLoaded && (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-text-secondary">
                {t.colorPickerEmpty}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.selectedColor}</h3>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl border border-border" style={{ backgroundColor: color }} />
                <div className="font-mono text-lg text-foreground">{color.toUpperCase()}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                  <span className="text-xs text-text-secondary">HEX</span>
                  <button onClick={() => copyValue(color, "hex")} className="flex items-center gap-1 text-xs text-foreground">
                    {copied === "hex" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {color.toUpperCase()}
                  </button>
                </div>
                {rgb && (
                  <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                    <span className="text-xs text-text-secondary">RGB</span>
                    <button onClick={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "rgb")} className="flex items-center gap-1 text-xs text-foreground">
                      {copied === "rgb" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      {rgb.r}, {rgb.g}, {rgb.b}
                    </button>
                  </div>
                )}
                {hsl && (
                  <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                    <span className="text-xs text-text-secondary">HSL</span>
                    <button onClick={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "hsl")} className="flex items-center gap-1 text-xs text-foreground">
                      {copied === "hsl" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      {hsl.h}, {hsl.s}%, {hsl.l}%
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">{t.pickCustom}</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-border" />
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
