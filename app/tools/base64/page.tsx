"use client";

import { useState, useCallback } from "react";
import { Binary, Copy, Download, Upload } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

export default function Base64Page() {
  const { t } = useLang();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const dataUrl = `data:${file.type};base64,${base64}`;
      setResult(dataUrl);
      setTextInput(dataUrl);
    } catch {
      setError(t.base64EncodeFailed);
    }
  }, [t]);

  const encodeText = () => {
    if (!textInput.trim()) return;
    setError(null);
    try {
      const encoded = btoa(unescape(encodeURIComponent(textInput)));
      setResult(encoded);
    } catch {
      setError(t.base64EncodeFailed);
    }
  };

  const decodeText = () => {
    if (!textInput.trim()) return;
    setError(null);
    try {
      const decoded = decodeURIComponent(escape(atob(textInput)));
      setResult(decoded);
    } catch {
      setError(t.base64DecodeFailed);
    }
  };

  const process = () => {
    if (mode === "encode") encodeText();
    else decodeText();
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encode" ? "encoded.txt" : "decoded.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <>
      <ToolSeo title={t.base64Title} description={t.base64Desc} path="/tools/base64" />
      <ToolPageLayout title={t.base64Title} description={t.base64Desc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={mode === "encode" ? t.base64EncodePlaceholder : t.base64DecodePlaceholder}
              className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
            />

            {mode === "encode" && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-text-secondary">{t.orUploadFile}</p>
                <FileUploader
                  accept="*"
                  label={t.base64Upload}
                  description={t.base64UploadDesc}
                  onFiles={handleFile}
                />
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
            )}

            {result && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.result}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={copyResult}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? t.copied : t.copy}
                    </button>
                    <button
                      onClick={downloadResult}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <Download className="h-3 w-3" />
                      {t.download}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="h-48 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm text-foreground focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.convertSettings}</h3>

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => { setMode("encode"); setResult(""); setError(null); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "encode"
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "border border-border text-text-secondary hover:border-accent/40"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t.encode}
                </button>
                <button
                  onClick={() => { setMode("decode"); setResult(""); setError(null); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "decode"
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "border border-border text-text-secondary hover:border-accent/40"
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  {t.decode}
                </button>
              </div>

              <p className="mb-4 text-xs text-text-secondary">
                {mode === "encode" ? t.base64EncodeNote : t.base64DecodeNote}
              </p>

              <button
                onClick={process}
                disabled={!textInput.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Binary className="h-4 w-4" />
                {mode === "encode" ? t.base64EncodeBtn : t.base64DecodeBtn}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
