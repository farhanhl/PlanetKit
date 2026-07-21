"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import FileUploader from "@/app/components/FileUploader";
import ToolSeo from "@/app/components/ToolSeo";

interface ExifData {
  [key: string]: string | number | undefined;
}

export default function ImageExifPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    setExif(null);
    setError(null);
    if (!f) return;
    try {
      const buffer = await f.arrayBuffer();
      const view = new DataView(buffer);
      const data: ExifData = { "File Name": f.name, "File Size": formatSize(f.size), "File Type": f.type };
      if (view.getUint16(0) !== 0xFFD8) { setExif(data); return; }
      let offset = 2;
      while (offset < buffer.byteLength) {
        const marker = view.getUint16(offset);
        if ((marker & 0xFF00) !== 0xFF00) break;
        const length = view.getUint16(offset + 2);
        if (marker === 0xFFE1) {
          const exifData = parseExif(view, offset + 4);
          Object.assign(data, exifData);
        }
        offset += 2 + length;
      }
      setExif(data);
    } catch {
      setError(t.exifFailed);
    }
  }, [t]);

  return (
    <>
      <ToolSeo title={t.exifTitle} description={t.exifDesc} path="/tools/image-exif" />
      <ToolPageLayout title={t.exifTitle} description={t.exifDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUploader accept=".jpg,.jpeg,.tiff,.webp" label={t.exifDrop} description={t.exifDropDesc} onFiles={handleFile} files={file ? [file] : []} onRemove={() => { setFile(null); setExif(null); }} />
            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
            {exif && (
              <div className="mt-4 rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.exifData}</h3>
                <div className="space-y-1">
                  {Object.entries(exif).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
                      <span className="text-text-secondary">{key}</span>
                      <span className="text-foreground font-mono">{String(val ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.exifNote}</h3>
              <p className="text-xs text-text-secondary">{t.exifNoteDesc}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseExif(view: DataView, start: number): ExifData {
  const data: ExifData = {};
  try {
    const header = String.fromCharCode(view.getUint8(start), view.getUint8(start + 1), view.getUint8(start + 2), view.getUint8(start + 3));
    if (header !== "Exif") return data;
    const tiffStart = start + 6;
    const bigEndian = view.getUint16(tiffStart) === 0x4D4D;
    const ifdOffset = view.getUint32(tiffStart + 4, bigEndian);
    const numEntries = view.getUint16(tiffStart + ifdOffset, bigEndian);
    const tags: Record<number, string> = { 0x010F: "Make", 0x0110: "Model", 0x0112: "Orientation", 0x011A: "X-Resolution", 0x011B: "Y-Resolution", 0x0131: "Software", 0x0132: "Date Time", 0x0213: "YCbCr Positioning", 0x8769: "Exif IFD Pointer", 0x829A: "Exposure Time", 0x829D: "F-Number", 0x8827: "ISO Speed Ratings", 0x9003: "Date Time Original", 0x920A: "Focal Length", 0xA001: "Color Space", 0xA405: "Focal Length In 35mm Film", 0xA420: "Image Unique ID" };
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entryOffset, bigEndian);
      const type = view.getUint16(entryOffset + 2, bigEndian);
      const count = view.getUint32(entryOffset + 4, bigEndian);
      if (tags[tag]) {
        const tagName = tags[tag];
        if (type === 2) {
          const strOffset = count > 4 ? tiffStart + view.getUint32(entryOffset + 8, bigEndian) : entryOffset + 8;
          let str = "";
          for (let j = 0; j < count - 1; j++) str += String.fromCharCode(view.getUint8(strOffset + j));
          data[tagName] = str;
        } else if (type === 3) {
          data[tagName] = view.getUint16(entryOffset + 8, bigEndian);
        } else if (type === 4) {
          data[tagName] = view.getUint32(entryOffset + 8, bigEndian);
        } else if (type === 5) {
          const ratOffset = tiffStart + view.getUint32(entryOffset + 8, bigEndian);
          const num = view.getUint32(ratOffset, bigEndian);
          const den = view.getUint32(ratOffset + 4, bigEndian);
          data[tagName] = den ? `${num}/${den}` : num;
        }
      }
    }
  } catch {}
  return data;
}
