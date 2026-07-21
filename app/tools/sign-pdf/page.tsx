"use client";

import { useState, useCallback, useRef } from "react";
import { Pen, Type, Upload, X } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import PdfPreview from "@/app/components/PdfPreview";
import ToolSeo from "@/app/components/ToolSeo";

type SignMode = "draw" | "type" | "upload";

export default function SignPdfPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<SignMode>("draw");
  const [typedName, setTypedName] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [sigWidth, setSigWidth] = useState(200);
  const [sigHeight, setSigHeight] = useState(60);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setError(null);
    setSignatureImage(null);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setSignatureImage(null);
    setError(null);
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
    if (canvasRef.current) {
      setSignatureImage(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureImage(null);
  };

  const handleTypeSignature = () => {
    if (!typedName.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 100);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "italic 48px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, 200, 50);
    setSignatureImage(canvas.toDataURL("image/png"));
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    const reader = new FileReader();
    reader.onload = () => setSignatureImage(reader.result as string);
    reader.readAsDataURL(imgFile);
  };

  const applySignature = async () => {
    if (!file || !signatureImage) return;
    setProcessing(true);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      const pages = pdf.getPages();

      const sigBytes = await fetch(signatureImage).then((r) => r.arrayBuffer());
      const sigImage = await pdf.embedPng(sigBytes);

      const lastPage = pages[pages.length - 1];
      const { width: pageW } = lastPage.getSize();

      const embeddedWidth = sigWidth;
      const embeddedHeight = sigHeight;

      lastPage.drawImage(sigImage, {
        x: (pageW - embeddedWidth) / 2,
        y: 80,
        width: embeddedWidth,
        height: embeddedHeight,
      });

      const bytes = await pdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "signed.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      setError(t.signFailed);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
    <ToolSeo title={t.signPdfTitle} description={t.signPdfDesc} path="/tools/sign-pdf" />
    <ToolPageLayout title={t.signPdfTitle} description={t.signPdfDesc}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileUploader
            accept=".pdf"
            label={t.signPdfDrop}
            description={t.signPdfDropDesc}
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

          {signatureImage && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 text-xs font-medium text-text-secondary">{t.signaturePreview}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureImage}
                alt="Signature"
                className="h-20 rounded-lg border border-border bg-white p-2"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.signSettings}</h3>

            <div className="mb-4 flex gap-2">
              {([
                { key: "draw", icon: Pen, label: t.draw },
                { key: "type", icon: Type, label: t.typeLabel },
                { key: "upload", icon: Upload, label: t.uploadLabel },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    mode === key
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "border border-border text-text-secondary hover:border-accent/40"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {mode === "draw" && (
              <div className="mb-4">
                <p className="mb-2 text-xs text-text-secondary">{t.drawSignature}</p>
                <div className="relative rounded-lg border border-border bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    className="w-full cursor-crosshair"
                  />
                  <button
                    onClick={clearCanvas}
                    className="absolute right-2 top-2 rounded p-1 text-text-secondary hover:text-error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {mode === "type" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.typeName}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder={t.typeNamePlaceholder}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={handleTypeSignature}
                    disabled={!typedName.trim()}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent/40 disabled:opacity-40"
                  >
                    {t.preview}
                  </button>
                </div>
              </div>
            )}

            {mode === "upload" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  {t.uploadSignature}
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUploadImage}
                  className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
                />
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">{t.width}</label>
                <input
                  type="number"
                  value={sigWidth}
                  onChange={(e) => setSigWidth(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">{t.height}</label>
                <input
                  type="number"
                  value={sigHeight}
                  onChange={(e) => setSigHeight(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={applySignature}
              disabled={!file || !signatureImage || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Pen className="h-4 w-4" />
              {processing ? t.signing : t.signPdfBtn}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
    </>
  );
}
