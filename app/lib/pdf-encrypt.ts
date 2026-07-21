import {
  PDFDocument,
  PDFDict,
  PDFHexString,
} from "pdf-lib";

// Minimal MD5 implementation for PDF encryption
function md5(message: Uint8Array): Uint8Array {
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const msg = new Uint8Array(message.length + 1);
  msg.set(message);
  msg[message.length] = 0x80;
  const len = message.length * 8;
  if (msg.length % 64 < 56) {
    const pad = new Uint8Array(56 - (msg.length % 64));
    const padded = new Uint8Array(msg.length + pad.length);
    padded.set(msg);
    padded.set(pad, msg.length);
    const lenArr = new Uint8Array(8);
    lenArr[0] = len & 0xff;
    lenArr[1] = (len >> 8) & 0xff;
    lenArr[2] = (len >> 16) & 0xff;
    lenArr[3] = (len >> 24) & 0xff;
    const final = new Uint8Array(padded.length + 8);
    final.set(padded);
    final.set(lenArr, padded.length);
    return processMd5(final, K, s);
  }
  const pad = new Uint8Array(64 - (msg.length % 64) + 56);
  const padded = new Uint8Array(msg.length + pad.length);
  padded.set(msg);
  padded.set(pad, msg.length);
  const lenArr = new Uint8Array(8);
  lenArr[0] = len & 0xff;
  lenArr[1] = (len >> 8) & 0xff;
  lenArr[2] = (len >> 16) & 0xff;
  lenArr[3] = (len >> 24) & 0xff;
  const final = new Uint8Array(padded.length + 8);
  final.set(padded);
  final.set(lenArr, padded.length);
  return processMd5(final, K, s);
}

function processMd5(data: Uint8Array, K: number[], s: number[]): Uint8Array {
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let i = 0; i < data.length; i += 64) {
    const M = new Array(32);
    for (let j = 0; j < 16; j++) {
      M[j] =
        data[i + j * 4] |
        (data[i + j * 4 + 1] << 8) |
        (data[i + j * 4 + 2] << 16) |
        (data[i + j * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let j = 0; j < 64; j++) {
      let F: number;
      if (j < 16) F = (B & C) | (~B & D);
      else if (j < 32) F = (D & B) | (~D & C);
      else if (j < 48) F = B ^ C ^ D;
      else F = C ^ (B | ~D);
      F = (F + A + K[j] + M[j === 16 ? (5 * j + 1) % 16 : j < 32 ? (3 * j + 5) % 16 : (7 * j) % 16]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << s[j]) | (F >>> (32 - s[j])))) | 0;
    }
    const [a, b, c, d] = [A, B, C, D];
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }
  const result = new Uint8Array(16);
  result[0] = a0 & 0xff;
  result[1] = (a0 >>> 8) & 0xff;
  result[2] = (a0 >>> 16) & 0xff;
  result[3] = (a0 >>> 24) & 0xff;
  result[4] = b0 & 0xff;
  result[5] = (b0 >>> 8) & 0xff;
  result[6] = (b0 >>> 16) & 0xff;
  result[7] = (b0 >>> 24) & 0xff;
  result[8] = c0 & 0xff;
  result[9] = (c0 >>> 8) & 0xff;
  result[10] = (c0 >>> 16) & 0xff;
  result[11] = (c0 >>> 24) & 0xff;
  result[12] = d0 & 0xff;
  result[13] = (d0 >>> 8) & 0xff;
  result[14] = (d0 >>> 16) & 0xff;
  result[15] = (d0 >>> 24) & 0xff;
  return result;
}

// RC4 encryption
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) S[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const result = new Uint8Array(data.length);
  let x = 0, y = 0;
  for (let i = 0; i < data.length; i++) {
    x = (x + 1) & 0xff;
    y = (y + S[x]) & 0xff;
    [S[x], S[y]] = [S[y], S[x]];
    result[i] = data[i] ^ S[(S[x] + S[y]) & 0xff];
  }
  return result;
}

const PDF_PASSWORD_PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

export async function encryptPdf(pdfBytes: Uint8Array, password: string): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const paddedPassword = new Uint8Array(32);
  paddedPassword.set(passwordBytes.slice(0, 32));
  if (passwordBytes.length < 32) {
    paddedPassword.set(PDF_PASSWORD_PADDING.slice(0, 32 - passwordBytes.length), passwordBytes.length);
  }

  // Generate random file encryption key (5 bytes for V1/R2)
  const encryptionKey = new Uint8Array(5);
  for (let i = 0; i < 5; i++) encryptionKey[i] = Math.floor(Math.random() * 256);

  // Compute O (owner key) - V1/R2
  const ownerStep1 = md5(paddedPassword);
  const ownerKey = rc4(ownerStep1, encryptionKey);

  // Compute U (user key) - V1/R2
  const userKey = rc4(md5(new Uint8Array([...paddedPassword, ...encryptionKey])), PDF_PASSWORD_PADDING);

  // Convert to hex strings for PDF
  const oHex = Array.from(ownerKey).map((b) => b.toString(16).padStart(2, "0")).join("");
  const uHex = Array.from(userKey).map((b) => b.toString(16).padStart(2, "0")).join("");

  // Load PDF and add encryption
  const pdf = await PDFDocument.load(pdfBytes);
  const ctx = pdf.context;

  const encryptDict = ctx.obj({
    Type: "Crypt",
    Filter: "Standard",
    V: 1,
    R: 2,
    O: PDFHexString.of(oHex),
    U: PDFHexString.of(uHex),
    P: -3904,
  }) as PDFDict;

  ctx.trailerInfo.Encrypt = encryptDict;
  return pdf.save();
}
