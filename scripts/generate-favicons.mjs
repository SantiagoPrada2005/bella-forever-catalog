import fs from 'fs';
import zlib from 'zlib';

// --- CRC32 Implementation ---
const makeCRCTable = () => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
};
const crcTable = makeCRCTable();
const crc32 = (buf) => {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

// --- PNG Encoder ---
function createPng(w, h, rgba) {
  const str = w * 4;
  const filtered = Buffer.alloc((str + 1) * h);
  for (let y = 0; y < h; y++) {
    filtered[y * (str + 1)] = 0;
    rgba.copy(filtered, y * (str + 1) + 1, y * str, (y + 1) * str);
  }
  const comp = zlib.deflateSync(filtered, { level: 9 });
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(12 + 13);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(w, 8);
  ihdr.writeUInt32BE(h, 12);
  ihdr[16] = 8; ihdr[17] = 6; ihdr[18] = 0; ihdr[19] = 0; ihdr[20] = 0;
  ihdr.writeUInt32BE(crc32(ihdr.subarray(4, 21)), 21);
  
  const idat = Buffer.alloc(12 + comp.length);
  idat.writeUInt32BE(comp.length, 0);
  idat.write('IDAT', 4);
  comp.copy(idat, 8);
  idat.writeUInt32BE(crc32(idat.subarray(4, 8 + comp.length)), 8 + comp.length);
  
  const iend = Buffer.alloc(12);
  iend.writeUInt32BE(0, 0);
  iend.write('IEND', 4);
  iend.writeUInt32BE(crc32(Buffer.from('IEND')), 8);
  
  return Buffer.concat([header, ihdr, idat, iend]);
}

// --- ICO Builder from PNGs ---
function buildIco(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const headerSize = 6 + count * 16;
  let currentOffset = headerSize;
  const entries = [];
  
  for (const item of pngBuffersWithSizes) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // palette colors (0 = no palette)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buf.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += item.buf.length;
  }
  
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // type 1 = icon
  iconDir.writeUInt16LE(count, 4); // count
  
  return Buffer.concat([iconDir, ...entries, ...pngBuffersWithSizes.map(i => i.buf)]);
}

// --- Parse Base Isotipo ---
const isotipoBuf = fs.readFileSync('public/isotipo.png');
let pos = 8;
const idatChunks = [];
let width = 0, height = 0;
while (pos < isotipoBuf.length) {
  const len = isotipoBuf.readUInt32BE(pos);
  const type = isotipoBuf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IHDR') {
    width = isotipoBuf.readUInt32BE(pos + 8);
    height = isotipoBuf.readUInt32BE(pos + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(isotipoBuf.subarray(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));
const bytesPerPixel = 4;
const stride = width * bytesPerPixel;
const uncompressed = Buffer.alloc(width * height * bytesPerPixel);
let rawOffset = 0;
for (let y = 0; y < height; y++) {
  const filterType = raw[rawOffset++];
  const prevLineOffset = (y - 1) * stride;
  const currLineOffset = y * stride;
  for (let x = 0; x < stride; x++) {
    const rawByte = raw[rawOffset++];
    const a = x >= bytesPerPixel ? uncompressed[currLineOffset + x - bytesPerPixel] : 0;
    const b = y > 0 ? uncompressed[prevLineOffset + x] : 0;
    const c = (x >= bytesPerPixel && y > 0) ? uncompressed[prevLineOffset + x - bytesPerPixel] : 0;
    let val = 0;
    if (filterType === 0) val = rawByte;
    else if (filterType === 1) val = (rawByte + a) & 0xff;
    else if (filterType === 2) val = (rawByte + b) & 0xff;
    else if (filterType === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
    else if (filterType === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      val = (rawByte + pr) & 0xff;
    }
    uncompressed[currLineOffset + x] = val;
  }
}

// Bounding box of gold artwork
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const alpha = uncompressed[(y * width + x) * 4 + 3];
    if (alpha > 8) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

function getInterpolatedPixel(u, v) {
  const px = minX + u * (cropW - 1);
  const py = minY + v * (cropH - 1);
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = px - x0;
  const fy = py - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx10 = (y0 * width + x1) * 4;
  const idx01 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  const r = (1 - fx) * (1 - fy) * uncompressed[idx00] + fx * (1 - fy) * uncompressed[idx10] + (1 - fx) * fy * uncompressed[idx01] + fx * fy * uncompressed[idx11];
  const g = (1 - fx) * (1 - fy) * uncompressed[idx00+1] + fx * (1 - fy) * uncompressed[idx10+1] + (1 - fx) * fy * uncompressed[idx01+1] + fx * fy * uncompressed[idx11+1];
  const b = (1 - fx) * (1 - fy) * uncompressed[idx00+2] + fx * (1 - fy) * uncompressed[idx10+2] + (1 - fx) * fy * uncompressed[idx01+2] + fx * fy * uncompressed[idx11+2];
  const a = (1 - fx) * (1 - fy) * uncompressed[idx00+3] + fx * (1 - fy) * uncompressed[idx10+3] + (1 - fx) * fy * uncompressed[idx01+3] + fx * fy * uncompressed[idx11+3];

  return [r, g, b, a / 255];
}

function renderBurgundyIcon(size, paddingRatio) {
  const out = Buffer.alloc(size * size * 4);
  const pad = Math.round(size * paddingRatio);
  const targetArea = size - pad * 2;
  const scale = targetArea / Math.max(cropW, cropH);
  const renderedW = Math.round(cropW * scale);
  const renderedH = Math.round(cropH * scale);
  const offX = Math.round((size - renderedW) / 2);
  const offY = Math.round((size - renderedH) / 2);

  // Gradient: #5A1623 (90, 22, 35) to #3D0D16 (61, 13, 22)
  const c1 = { r: 90, g: 22, b: 35 };
  const c2 = { r: 61, g: 13, b: 22 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const t = (x + y) / ((size - 1) * 2);
      out[idx] = Math.round(c1.r * (1 - t) + c2.r * t);
      out[idx + 1] = Math.round(c1.g * (1 - t) + c2.g * t);
      out[idx + 2] = Math.round(c1.b * (1 - t) + c2.b * t);
      out[idx + 3] = 255;
    }
  }

  // Supersampling 3x3 for small sizes (<= 48), 2x2 for large
  const grid = size <= 48 ? 3 : 2;
  const totalSamples = grid * grid;

  for (let dy = 0; dy < renderedH; dy++) {
    for (let dx = 0; dx < renderedW; dx++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          const sx = (gx + 0.5) / grid;
          const sy = (gy + 0.5) / grid;
          const u = (dx + sx) / renderedW;
          const v = (dy + sy) / renderedH;
          const [r, g, b, a] = getInterpolatedPixel(u, v);
          sumR += r * a;
          sumG += g * a;
          sumB += b * a;
          sumA += a;
        }
      }
      const avgA = sumA / totalSamples;
      if (avgA > 0.002) {
        const avgR = sumR / sumA;
        const avgG = sumG / sumA;
        const avgB = sumB / sumA;

        const destX = offX + dx;
        const destY = offY + dy;
        const destIdx = (destY * size + destX) * 4;

        const bgR = out[destIdx];
        const bgG = out[destIdx + 1];
        const bgB = out[destIdx + 2];

        out[destIdx] = Math.round(avgR * avgA + bgR * (1 - avgA));
        out[destIdx + 1] = Math.round(avgG * avgA + bgG * (1 - avgA));
        out[destIdx + 2] = Math.round(avgB * avgA + bgB * (1 - avgA));
      }
    }
  }

  return createPng(size, size, out);
}

// Generate all standard and Google 48px multiples
console.log('📦 Generando iconos...');
const png16 = renderBurgundyIcon(16, 0.10);
const png32 = renderBurgundyIcon(32, 0.12);
const png48 = renderBurgundyIcon(48, 0.14);
const png96 = renderBurgundyIcon(96, 0.15);
const png144 = renderBurgundyIcon(144, 0.15);
const png180 = renderBurgundyIcon(180, 0.16);
const png192 = renderBurgundyIcon(192, 0.16);
const png512 = renderBurgundyIcon(512, 0.16);

// Write PNGs
fs.writeFileSync('public/favicon-16x16.png', png16);
fs.writeFileSync('public/favicon-32x32.png', png32);
fs.writeFileSync('public/icon-48.png', png48);
fs.writeFileSync('public/icon-96.png', png96);
fs.writeFileSync('public/icon-144.png', png144);
fs.writeFileSync('public/apple-touch-icon.png', png180);
fs.writeFileSync('public/icon-192.png', png192);
fs.writeFileSync('public/icon-512.png', png512);
fs.writeFileSync('public/icon.png', png512);

// Build multi-res favicon.ico (16, 32, 48)
const icoBuf = buildIco([
  { size: 16, buf: png16 },
  { size: 32, buf: png32 },
  { size: 48, buf: png48 }
]);
fs.writeFileSync('public/favicon.ico', icoBuf);

console.log('✅ Todos los iconos y public/favicon.ico fueron generados con éxito!');
