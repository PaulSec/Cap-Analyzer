import { PacketRecord, ParseProgress } from '@/types/network';
import { decodePacket } from './packetDecoder';

interface ParseResult {
  packets: PacketRecord[];
  warnings: string[];
}

type ProgressCb = (progress: ParseProgress) => void;

function readUInt32(view: DataView, offset: number, little: boolean): number {
  return view.getUint32(offset, little);
}

function detectPcapEndianness(buffer: ArrayBuffer): { little: boolean; nanos: boolean } | null {
  if (buffer.byteLength < 4) return null;
  const bytes = new Uint8Array(buffer, 0, 4);
  const magicHex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (magicHex === 'd4c3b2a1') return { little: true, nanos: false };
  if (magicHex === 'a1b2c3d4') return { little: false, nanos: false };
  if (magicHex === '4d3cb2a1') return { little: true, nanos: true };
  if (magicHex === 'a1b23c4d') return { little: false, nanos: true };

  return null;
}

function parsePcap(buffer: ArrayBuffer, onProgress?: ProgressCb): ParseResult {
  const warnings: string[] = [];
  const view = new DataView(buffer);
  const endian = detectPcapEndianness(buffer);
  if (!endian) {
    throw new Error('Unrecognized PCAP magic number');
  }

  if (buffer.byteLength < 24) {
    throw new Error('PCAP file too short');
  }

  const linkType = readUInt32(view, 20, endian.little);
  const packets: PacketRecord[] = [];
  let offset = 24;
  let idx = 0;

  while (offset + 16 <= buffer.byteLength) {
    const tsSec = readUInt32(view, offset, endian.little);
    const tsFraction = readUInt32(view, offset + 4, endian.little);
    const inclLen = readUInt32(view, offset + 8, endian.little);
    const origLen = readUInt32(view, offset + 12, endian.little);
    offset += 16;

    if (offset + inclLen > buffer.byteLength) {
      warnings.push(`Packet ${idx} truncated due to invalid length`);
      break;
    }

    const timestampMs = tsSec * 1000 + (endian.nanos ? tsFraction / 1_000_000 : tsFraction / 1000);
    const packetData = new Uint8Array(buffer, offset, inclLen);
    const decoded = decodePacket({
      packetId: `pkt-${idx}`,
      timestampMs,
      packetData,
      originalLength: origLen || inclLen,
      linkType
    });

    if (decoded) packets.push(decoded);
    offset += inclLen;
    idx += 1;

    if (idx % 5000 === 0 && onProgress) {
      onProgress({
        status: 'parsing',
        progressPct: Math.min(99, Math.round((offset / buffer.byteLength) * 100)),
        message: `Parsed ${idx} packets`,
        warnings
      });
    }
  }

  return { packets, warnings };
}

function align32(value: number): number {
  return (value + 3) & ~3;
}

function parsePcapng(buffer: ArrayBuffer, onProgress?: ProgressCb): ParseResult {
  const view = new DataView(buffer);
  const warnings: string[] = [];
  const packets: PacketRecord[] = [];

  let little = true;
  let offset = 0;
  let idx = 0;
  let nextInterfaceId = 0;
  const interfaceTypes = new Map<number, number>();

  while (offset + 12 <= buffer.byteLength) {
    const blockType = view.getUint32(offset, little);
    const blockLen = view.getUint32(offset + 4, little);

    if (blockLen < 12 || offset + blockLen > buffer.byteLength) {
      warnings.push(`Invalid PCAPNG block length at offset ${offset}`);
      break;
    }

    if (blockType === 0x0a0d0d0a) {
      const bom = view.getUint32(offset + 8, true);
      if (bom === 0x1a2b3c4d) {
        little = true;
      } else if (bom === 0x4d3c2b1a) {
        little = false;
      } else {
        warnings.push('Unknown PCAPNG byte-order magic');
      }
    } else if (blockType === 0x00000001) {
      const linkType = view.getUint16(offset + 8, little);
      const interfaceId = nextInterfaceId;
      nextInterfaceId += 1;
      interfaceTypes.set(interfaceId, linkType);
    } else if (blockType === 0x00000006) {
      const interfaceId = view.getUint32(offset + 8, little);
      const tsHigh = view.getUint32(offset + 12, little);
      const tsLow = view.getUint32(offset + 16, little);
      const capLen = view.getUint32(offset + 20, little);
      const origLen = view.getUint32(offset + 24, little);
      const dataOffset = offset + 28;

      if (dataOffset + capLen > offset + blockLen) {
        warnings.push(`Invalid EPB cap length at packet ${idx}`);
      } else {
        const ts = tsHigh * 0x100000000 + tsLow;
        const timestampMs = ts / 1000;
        const packetData = new Uint8Array(buffer, dataOffset, capLen);
        const decoded = decodePacket({
          packetId: `pkt-${idx}`,
          timestampMs,
          packetData,
          originalLength: origLen || capLen,
          linkType: interfaceTypes.get(interfaceId) ?? interfaceTypes.get(0) ?? 1
        });
        if (decoded) packets.push(decoded);
      }
      idx += 1;
    } else if (blockType === 0x00000003) {
      const origLen = view.getUint32(offset + 8, little);
      const dataOffset = offset + 12;
      const capLen = blockLen - 16;
      const packetData = new Uint8Array(buffer, dataOffset, Math.max(0, capLen));
      const decoded = decodePacket({
        packetId: `pkt-${idx}`,
        timestampMs: idx,
        packetData,
        originalLength: origLen,
        linkType: interfaceTypes.get(0) ?? 1
      });
      if (decoded) packets.push(decoded);
      idx += 1;
    } else if (blockType === 0x00000002) {
      const interfaceId = view.getUint16(offset + 8, little);
      const tsHigh = view.getUint32(offset + 12, little);
      const tsLow = view.getUint32(offset + 16, little);
      const capLen = view.getUint32(offset + 20, little);
      const origLen = view.getUint32(offset + 24, little);
      const dataOffset = offset + 28;
      if (dataOffset + capLen <= offset + blockLen) {
        const ts = tsHigh * 0x100000000 + tsLow;
        const packetData = new Uint8Array(buffer, dataOffset, capLen);
        const decoded = decodePacket({
          packetId: `pkt-${idx}`,
          timestampMs: ts / 1000,
          packetData,
          originalLength: origLen || capLen,
          linkType: interfaceTypes.get(interfaceId) ?? interfaceTypes.get(0) ?? 1
        });
        if (decoded) packets.push(decoded);
      }
      idx += 1;
    }

    offset += align32(blockLen);

    if (idx > 0 && idx % 5000 === 0 && onProgress) {
      onProgress({
        status: 'parsing',
        progressPct: Math.min(99, Math.round((offset / buffer.byteLength) * 100)),
        message: `Parsed ${idx} packets`,
        warnings
      });
    }
  }

  return { packets, warnings };
}

export async function parseCaptureFile(
  fileName: string,
  buffer: ArrayBuffer,
  onProgress?: ProgressCb
): Promise<ParseResult> {
  onProgress?.({ status: 'parsing', progressPct: 1, message: `Reading ${fileName}`, warnings: [] });

  const lower = fileName.toLowerCase();
  let result: ParseResult;
  if (lower.endsWith('.pcap')) {
    result = parsePcap(buffer, onProgress);
  } else if (lower.endsWith('.pcapng')) {
    result = parsePcapng(buffer, onProgress);
  } else {
    try {
      result = parsePcap(buffer, onProgress);
    } catch {
      result = parsePcapng(buffer, onProgress);
    }
  }

  onProgress?.({
    status: 'ready',
    progressPct: 100,
    message: `Parsed ${result.packets.length} packets`,
    warnings: result.warnings
  });

  return result;
}
