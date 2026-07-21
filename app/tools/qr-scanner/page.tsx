"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Copy, Check, Upload } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface BarcodeDetectorResult {
  rawValue: string;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => {
      detect(source: CanvasImageSource | HTMLImageElement): Promise<BarcodeDetectorResult[]>;
    };
  }
}

export default function QrScannerPage() {
  const { t } = useLang();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanFrame();
    } catch {
      setError(t.qrScannerCameraError);
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    if (window.BarcodeDetector) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const detect = async () => {
        if (!video || !streamRef.current || video.readyState < 2) {
          requestAnimationFrame(detect);
          return;
        }
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            setResult(barcodes[0].rawValue);
            stopCamera();
            return;
          }
        } catch {}
        requestAnimationFrame(detect);
      };
      detect();
    } else {
      stopCamera();
      setError(t.qrScannerNotSupported);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = async (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        if (window.BarcodeDetector) {
          try {
            const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(img);
            if (barcodes.length > 0) {
              setResult(barcodes[0].rawValue);
            } else {
              setError(t.qrScannerNoResult);
            }
          } catch {
            setError(t.qrScannerFailed);
          }
        } else {
          setError(t.qrScannerNotSupported);
        }
      };
    };
    reader.readAsDataURL(file);
  }, [t]);

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <ToolSeo title={t.qrScannerTitle} description={t.qrScannerDesc} path="/tools/qr-scanner" />
      <ToolPageLayout title={t.qrScannerTitle} description={t.qrScannerDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {scanning ? (
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
                <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
                <button
                  onClick={stopCamera}
                  className="absolute right-3 top-3 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm"
                >
                  {t.qrScannerStop}
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/40"
              >
                <Camera className="mb-3 h-10 w-10 text-text-secondary/40" />
                <p className="text-sm font-medium text-foreground">{t.qrScannerDrop}</p>
                <p className="mt-1 text-xs text-text-secondary">{t.qrScannerDropDesc}</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {result && (
              <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.result}</p>
                  <button onClick={copyResult} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-all rounded-lg bg-background p-3 font-mono text-sm text-foreground">{result}</pre>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.qrScannerActions}</h3>
              <p className="mb-4 text-xs text-text-secondary">{t.qrScannerNote}</p>
              <div className="space-y-2">
                <button
                  onClick={startCamera}
                  disabled={scanning}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Camera className="h-4 w-4" />
                  {t.qrScannerCamera}
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  {t.qrScannerUpload}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
