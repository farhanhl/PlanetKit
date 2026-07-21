"use client";

import { useEffect, useMemo } from "react";

interface ImagePreviewProps {
  file: File;
  width?: number;
  className?: string;
}

export default function ImagePreview({
  file,
  width = 200,
  className = "",
}: ImagePreviewProps) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={file.name}
      className={`rounded-lg object-contain ${className}`}
      style={{ maxWidth: width, maxHeight: width, width: "100%", height: "auto" }}
    />
  );
}
