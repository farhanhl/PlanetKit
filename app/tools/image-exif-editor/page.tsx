"use client";

import { useState, useCallback, useRef } from "react";
import { Save, Trash2, Eye, EyeOff } from "lucide-react";
import piexif, { ExifObj } from "piexifjs";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";
import { useLang } from "@/app/lib/i18n/context";

interface EditableField {
  key: string;
  label: string;
  ifd: "0th" | "Exif" | "GPS";
  tag: number;
  type: "string" | "number" | "rational";
  readOnly?: boolean;
}

const EDITABLE_FIELDS: EditableField[] = [
  { key: "Make", label: "Make", ifd: "0th", tag: piexif.ImageIFD.Make, type: "string" },
  { key: "Model", label: "Model", ifd: "0th", tag: piexif.ImageIFD.Model, type: "string" },
  { key: "Software", label: "Software", ifd: "0th", tag: piexif.ImageIFD.Software, type: "string" },
  { key: "DateTime", label: "Date Time", ifd: "0th", tag: piexif.ImageIFD.DateTime, type: "string" },
  { key: "Artist", label: "Artist", ifd: "0th", tag: piexif.ImageIFD.Artist, type: "string" },
  { key: "Copyright", label: "Copyright", ifd: "0th", tag: piexif.ImageIFD.Copyright, type: "string" },
  { key: "ImageDescription", label: "Description", ifd: "0th", tag: piexif.ImageIFD.ImageDescription, type: "string" },
  { key: "Orientation", label: "Orientation", ifd: "0th", tag: piexif.ImageIFD.Orientation, type: "number", readOnly: true },
  { key: "DateTimeOriginal", label: "Date Time Original", ifd: "Exif", tag: piexif.ExifIFD.DateTimeOriginal, type: "string" },
  { key: "DateTimeDigitized", label: "Date Time Digitized", ifd: "Exif", tag: piexif.ExifIFD.DateTimeDigitized, type: "string" },
  { key: "ExposureTime", label: "Exposure Time", ifd: "Exif", tag: piexif.ExifIFD.ExposureTime, type: "rational", readOnly: true },
  { key: "FNumber", label: "F-Number", ifd: "Exif", tag: piexif.ExifIFD.FNumber, type: "rational", readOnly: true },
  { key: "ISOSpeedRatings", label: "ISO", ifd: "Exif", tag: piexif.ExifIFD.ISOSpeedRatings, type: "number", readOnly: true },
  { key: "FocalLength", label: "Focal Length", ifd: "Exif", tag: piexif.ExifIFD.FocalLength, type: "rational", readOnly: true },
  { key: "LensMake", label: "Lens Make", ifd: "Exif", tag: piexif.ExifIFD.LensMake, type: "string" },
  { key: "LensModel", label: "Lens Model", ifd: "Exif", tag: piexif.ExifIFD.LensModel, type: "string" },
];

function formatExifValue(value: unknown, type: string): string {
  if (value === undefined || value === null) return "";
  if (type === "rational" && Array.isArray(value)) {
    const [num, den] = value;
    if (den === 0) return String(num);
    return `${num}/${den}`;
  }
  return String(value);
}

function parseExifValue(raw: unknown, type: string): unknown {
  if (type === "number") {
    const n = Number(raw);
    return isNaN(n) ? undefined : n;
  }
  if (type === "rational") {
    const str = String(raw);
    if (str.includes("/")) {
      const [num, den] = str.split("/").map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) return [num, den];
    }
    const n = Number(str);
    if (!isNaN(n)) return [n, 1];
    return undefined;
  }
  const s = String(raw).trim();
  return s || undefined;
}

export default function ImageExifEditorPage() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [exifObj, setExifObj] = useState<ExifObj | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReadOnly, setShowReadOnly] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setEdits({});
    setError(null);
    setPreview("");
    setDataUrl("");
    setExifObj(null);

    const isJpeg = f.type === "image/jpeg" || f.name.toLowerCase().endsWith(".jpg") || f.name.toLowerCase().endsWith(".jpeg");
    if (!isJpeg) {
      setError(t.exifEditorJpegOnly);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setDataUrl(url);
        setPreview(url);
        try {
          const exif = piexif.load(url);
          setExifObj(exif);
        } catch {
          setExifObj({ "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {} });
        }
      };
      reader.readAsDataURL(f);
    } catch {
      setError(t.exifEditorReadFailed);
    }
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }, [handleFile]);

  const updateField = (field: EditableField, value: string) => {
    setEdits((prev) => ({ ...prev, [field.key]: value }));
  };

  const getFieldValue = (field: EditableField): string => {
    if (edits[field.key] !== undefined) return edits[field.key];
    if (!exifObj) return "";
    const ifdData = exifObj[field.ifd];
    const raw = ifdData[field.tag];
    return formatExifValue(raw, field.type);
  };

  const hasChanges = Object.keys(edits).some((key) => {
    const field = EDITABLE_FIELDS.find((f) => f.key === key);
    if (!field || field.readOnly) return false;
    return edits[key] !== undefined;
  });

  const save = async () => {
    if (!exifObj || !dataUrl) return;
    setSaving(true);
    setError(null);

    try {
      const newExif = { ...exifObj, "0th": { ...exifObj["0th"] }, Exif: { ...exifObj.Exif } };

      for (const field of EDITABLE_FIELDS) {
        if (field.readOnly) continue;
        if (edits[field.key] === undefined) continue;

        const parsed = parseExifValue(edits[field.key], field.type);
        if (parsed === undefined) {
          delete newExif[field.ifd][field.tag];
        } else {
          newExif[field.ifd][field.tag] = parsed;
        }
      }

      const exifBinary = piexif.dump(newExif);
      const newDataUrl = piexif.insert(exifBinary, dataUrl);

      const link = document.createElement("a");
      link.href = newDataUrl;
      link.download = file ? `exif_${file.name}` : "exif_edited.jpg";
      link.click();
    } catch {
      setError(t.exifEditorSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const removeAllExif = () => {
    if (!dataUrl) return;
    try {
      const cleaned = piexif.remove(dataUrl);
      setDataUrl(cleaned);
      setPreview(cleaned);
      setExifObj({ "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {} });
      setEdits({});
    } catch {
      setError(t.exifEditorRemoveFailed);
    }
  };

  const editableFields = EDITABLE_FIELDS.filter((f) => !f.readOnly);
  const readOnlyFields = EDITABLE_FIELDS.filter((f) => f.readOnly);

  return (
    <>
      <ToolSeo
        title={t.exifEditorTitle}
        description={t.exifEditorDesc}
        path="/tools/image-exif-editor"
      />
      <ToolPageLayout title={t.exifEditorTitle} description={t.exifEditorDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!dataUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-all hover:border-accent/50 hover:bg-surface-hover/50 sm:p-12"
              >
                <p className="text-sm font-medium text-foreground">{t.exifEditorDrop}</p>
                <p className="text-xs text-text-secondary">{t.exifEditorDropDesc}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                  <button
                    onClick={() => { setFile(null); setPreview(""); setDataUrl(""); setExifObj(null); setEdits({}); }}
                    className="rounded p-1 text-text-secondary transition-colors hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 overflow-hidden rounded-lg border border-border">
                  <img src={preview} alt="Preview" className="w-full object-contain" style={{ maxHeight: "400px" }} />
                </div>

                {exifObj && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{t.exifEditorEditableFields}</h3>
                    </div>

                    <div className="space-y-3">
                      {editableFields.map((field) => {
                        const val = getFieldValue(field);
                        return (
                          <div key={field.key}>
                            <label className="mb-1 block text-xs text-text-secondary">{field.label}</label>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => updateField(field, e.target.value)}
                              placeholder={field.type === "rational" ? "e.g. 227/100" : ""}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => setShowReadOnly(!showReadOnly)}
                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground"
                      >
                        {showReadOnly ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showReadOnly ? t.exifEditorHideReadOnly : t.exifEditorShowReadOnly}
                      </button>

                      {showReadOnly && (
                        <div className="mt-3 space-y-1">
                          {readOnlyFields.map((field) => {
                            const val = getFieldValue(field);
                            return (
                              <div key={field.key} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
                                <span className="text-text-secondary">{field.label}</span>
                                <span className="font-mono text-foreground">{val || "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {error && <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.exifEditorActions}</h3>
              <div className="space-y-2">
                <button
                  onClick={save}
                  disabled={!dataUrl || !hasChanges || saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save className="h-4 w-4" />
                  {saving ? t.exifEditorSaving : t.exifEditorSaveDownload}
                </button>
                <button
                  onClick={removeAllExif}
                  disabled={!dataUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.exifEditorRemoveAll}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.exifEditorAboutTitle}</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>{t.exifEditorAboutDesc1}</p>
                <p>{t.exifEditorAboutDesc2}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.exifEditorNoteTitle}</h3>
              <p className="text-xs text-text-secondary">{t.exifEditorNoteDesc}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
