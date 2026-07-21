declare module "piexifjs" {
  interface ExifObj {
    "0th": Record<number, unknown>;
    Exif: Record<number, unknown>;
    GPS: Record<number, unknown>;
    Interop: Record<number, unknown>;
    "1st": Record<number, unknown>;
    thumbnail?: string;
  }

  const ImageIFD: Record<string, number>;
  const ExifIFD: Record<string, number>;
  const GPSIFD: Record<string, number>;
  const InteropIFD: Record<string, number>;

  function load(dataUrl: string): ExifObj;
  function dump(exifObj: ExifObj): string;
  function insert(exifBinary: string, jpegData: string): string;
  function remove(jpegData: string): string;

  const piexif: {
    version: string;
    remove: typeof remove;
    insert: typeof insert;
    load: typeof load;
    dump: typeof dump;
    TAGS: Record<string, unknown>;
    ImageIFD: typeof ImageIFD;
    ExifIFD: typeof ExifIFD;
    GPSIFD: typeof GPSIFD;
    InteropIFD: typeof InteropIFD;
    GPSHelper: Record<string, unknown>;
    piexif: typeof piexif;
  };

  export { ExifObj, ImageIFD, ExifIFD, GPSIFD, InteropIFD, load, dump, insert, remove };
  export default piexif;
}
