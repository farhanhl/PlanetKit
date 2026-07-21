"use client";

import { useState, useCallback, useRef } from "react";
import { Crop } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ImagePreview from "@/app/components/ImagePreview";
import ToolSeo from "@/app/components/ToolSeo";

export default function ImageResizePage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockRatio, setLockRatio] = useState(true);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    setError(null);
    if (f) {
      if (preview) URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(f);
      setPreview(url);
      const img = new Image();
      img.onload = () => {
        setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        imgRef.current = img;
      };
      img.src = url;
    }
  }, [preview]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setOriginalSize({ w: 0, h: 0 });
    imgRef.current = null;
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && originalSize.w > 0) {
      setHeight(Math.round((val / originalSize.w) * originalSize.h));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && originalSize.h > 0) {
      setWidth(Math.round((val / originalSize.h) * originalSize.w));
    }
  };

  const resize = async () => {
    if (!file || !preview) return;
    setProcessing(true);
    setError(null);

    try {
      const img = await loadImage(preview);
      const canvas = document.createElement("canvas");

      const sx = Math.round((cropX / 100) * img.naturalWidth);
      const sy = Math.round((cropY / 100) * img.naturalHeight);
      const sw = Math.round((cropW / 100) * img.naturalWidth);
      const sh = Math.round((cropH / 100) * img.naturalHeight);

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, "image/png");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized_${file.name.replace(/\.[^.]+$/, "")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.resizeImageFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.resizeImageTitle} description={t.resizeImageDesc} path="/tools/image-resize" />
      <ToolPageLayout title={t.resizeImageTitle} description={t.resizeImageDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader
              accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
              label={t.resizeImageDrop}
              description={t.resizeImageDropDesc}
              onFiles={handleFile}
              files={file ? [file] : []}
              onRemove={() => removeFile()}
            />

            {file && preview && (
              <div className="mt-4">
                <ImagePreview file={file} />
                {originalSize.w > 0 && (
                  <p className="mt-2 text-xs text-text-secondary text-center">
                    {t.original}: {originalSize.w} × {originalSize.h} px
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.resizeSettings}</h3>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.width} (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.height} (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <label className="mb-4 flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(e) => setLockRatio(e.target.checked)}
                  className="accent-accent"
                />
                {t.lockAspectRatio}
              </label>

              <h4 className="mb-3 text-xs font-semibold text-foreground">{t.cropArea}</h4>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">X (%)</label>
                  <input type="number" min={0} max={100} value={cropX} onChange={(e) => setCropX(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Y (%)</label>
                  <input type="number" min={0} max={100} value={cropY} onChange={(e) => setCropY(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.width} (%)</label>
                  <input type="number" min={1} max={100} value={cropW} onChange={(e) => setCropW(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">{t.height} (%)</label>
                  <input type="number" min={1} max={100} value={cropH} onChange={(e) => setCropH(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
              </div>

              <button
                onClick={resize}
                disabled={!file || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Crop className="h-4 w-4" />
                {processing ? t.resizing : t.resizeImageBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, type);
  });
}
