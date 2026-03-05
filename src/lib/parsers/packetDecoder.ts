import { PacketRecord, TransportProtocol, NetworkProtocol } from '@/types/network';
import { inferService } from './services';

interface DecodeInput {
  packetId: string;
  timestampMs: number;
  packetData: Uint8Array;
  originalLength: number;
  linkType: number;
}

interface NetworkLayer {
  srcIp: string;
  dstIp: string;
  ipVersion: 4 | 6;
  protocolNumber: number;
  payloadOffset: number;
  protocolStack: NetworkProtocol[];
}

function readIPv4(bytes: Uint8Array, start: number): string {
  return `${bytes[start]}.${bytes[start + 1]}.${bytes[start + 2]}.${bytes[start + 3]}`;
}

function readIPv6(bytes: Uint8Array, start: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    const p = ((bytes[start + i] << 8) | bytes[start + i + 1]).toString(16);
    parts.push(p);
  }
  return parts.join(':').replace(/(^|:)0(:0)*:0(:|$)/, '::');
}

function parseEthernet(frame: Uint8Array): { etherType: number; payloadOffset: number } | null {
  if (frame.length < 14) return null;
  let etherType = (frame[12] << 8) | frame[13];
  let payloadOffset = 14;

  if (etherType === 0x8100 && frame.length >= 18) {
    etherType = (frame[16] << 8) | frame[17];
    payloadOffset = 18;
  }

  return { etherType, payloadOffset };
}

function parseLinuxSll(frame: Uint8Array): { etherType: number; payloadOffset: number } | null {
  // Linux cooked capture v1 (DLT_LINUX_SLL, 113): 16-byte pseudo-header.
  // Protocol type is in the last 2 bytes of the header.
  if (frame.length < 16) return null;
  const etherType = (frame[14] << 8) | frame[15];
  return { etherType, payloadOffset: 16 };
}

function parseLinuxSll2(frame: Uint8Array): { etherType: number; payloadOffset: number } | null {
  // Linux cooked capture v2 (DLT_LINUX_SLL2, 276): 20-byte pseudo-header.
  // Protocol type is in the first 2 bytes.
  if (frame.length < 20) return null;
  const etherType = (frame[0] << 8) | frame[1];
  return { etherType, payloadOffset: 20 };
}

function parseNetworkLayer(frame: Uint8Array, linkType: number): NetworkLayer | null {
  let protocolStack: NetworkProtocol[] = [];
  let offset = 0;

  if (linkType === 1) {
    const eth = parseEthernet(frame);
    if (!eth) return null;
    offset = eth.payloadOffset;
    if (eth.etherType === 0x0800) {
      protocolStack = ['IPv4'];
    } else if (eth.etherType === 0x86dd) {
      protocolStack = ['IPv6'];
    } else {
      return null;
    }
  } else if (linkType === 113) {
    const sll = parseLinuxSll(frame);
    if (!sll) return null;
    offset = sll.payloadOffset;
    if (sll.etherType === 0x0800) {
      protocolStack = ['IPv4'];
    } else if (sll.etherType === 0x86dd) {
      protocolStack = ['IPv6'];
    } else {
      return null;
    }
  } else if (linkType === 276) {
    const sll2 = parseLinuxSll2(frame);
    if (!sll2) return null;
    offset = sll2.payloadOffset;
    if (sll2.etherType === 0x0800) {
      protocolStack = ['IPv4'];
    } else if (sll2.etherType === 0x86dd) {
      protocolStack = ['IPv6'];
    } else {
      return null;
    }
  } else if (linkType === 101 || linkType === 228) {
    const firstNibble = frame[0] >> 4;
    if (firstNibble === 4) protocolStack = ['IPv4'];
    else if (firstNibble === 6) protocolStack = ['IPv6'];
    else return null;
  } else {
    return null;
  }

  const firstNibble = frame[offset] >> 4;
  if (firstNibble === 4) {
    if (frame.length < offset + 20) return null;
    const ihl = (frame[offset] & 0x0f) * 4;
    if (frame.length < offset + ihl) return null;
    const protocolNumber = frame[offset + 9];
    const srcIp = readIPv4(frame, offset + 12);
    const dstIp = readIPv4(frame, offset + 16);
    return {
      srcIp,
      dstIp,
      ipVersion: 4,
      protocolNumber,
      payloadOffset: offset + ihl,
      protocolStack
    };
  }

  if (firstNibble === 6) {
    if (frame.length < offset + 40) return null;
    const nextHeader = frame[offset + 6];
    const srcIp = readIPv6(frame, offset + 8);
    const dstIp = readIPv6(frame, offset + 24);
    return {
      srcIp,
      dstIp,
      ipVersion: 6,
      protocolNumber: nextHeader,
      payloadOffset: offset + 40,
      protocolStack
    };
  }

  return null;
}

function parseDnsName(data: Uint8Array, offset: number): { name: string; nextOffset: number } {
  const labels: string[] = [];
  let ptr = offset;
  let jumped = false;
  let jumpOffset = offset;

  while (ptr < data.length) {
    const len = data[ptr];
    if (len === 0) {
      ptr += 1;
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      if (ptr + 1 >= data.length) break;
      const pointer = ((len & 0x3f) << 8) | data[ptr + 1];
      if (!jumped) {
        jumpOffset = ptr + 2;
      }
      jumped = true;
      ptr = pointer;
      continue;
    }
    ptr += 1;
    if (ptr + len > data.length) break;
    labels.push(new TextDecoder().decode(data.slice(ptr, ptr + len)));
    ptr += len;
  }

  return { name: labels.join('.'), nextOffset: jumped ? jumpOffset : ptr };
}

function parseDnsMetadata(payload: Uint8Array) {
  if (payload.length < 12) return undefined;
  const flags = (payload[2] << 8) | payload[3];
  const questionCount = (payload[4] << 8) | payload[5];
  const answerCount = (payload[6] << 8) | payload[7];
  const responseCode = flags & 0x0f;

  let query: string | undefined;
  if (questionCount > 0) {
    const parsed = parseDnsName(payload, 12);
    query = parsed.name;
  }

  return {
    query,
    responseCode,
    answerCount,
    questionCount
  };
}

function parseTlsVersion(value: number): string | undefined {
  const map: Record<number, string> = {
    0x0301: 'TLS1.0',
    0x0302: 'TLS1.1',
    0x0303: 'TLS1.2',
    0x0304: 'TLS1.3'
  };
  return map[value];
}

function parseTlsSni(payload: Uint8Array): string | undefined {
  if (payload.length < 43) return undefined;
  let offset = 43;
  if (offset >= payload.length) return undefined;
  const sessionIdLen = payload[offset];
  offset += 1 + sessionIdLen;
  if (offset + 2 > payload.length) return undefined;
  const cipherLen = (payload[offset] << 8) | payload[offset + 1];
  offset += 2 + cipherLen;
  if (offset >= payload.length) return undefined;
  const compressionLen = payload[offset];
  offset += 1 + compressionLen;
  if (offset + 2 > payload.length) return undefined;
  const extLen = (payload[offset] << 8) | payload[offset + 1];
  offset += 2;
  const end = Math.min(payload.length, offset + extLen);

  while (offset + 4 <= end) {
    const extType = (payload[offset] << 8) | payload[offset + 1];
    const len = (payload[offset + 2] << 8) | payload[offset + 3];
    offset += 4;
    if (offset + len > end) break;

    if (extType === 0x0000 && len >= 5) {
      const listLen = (payload[offset] << 8) | payload[offset + 1];
      let p = offset + 2;
      const listEnd = Math.min(offset + 2 + listLen, offset + len);
      while (p + 3 <= listEnd) {
        const nameType = payload[p];
        const nameLen = (payload[p + 1] << 8) | payload[p + 2];
        p += 3;
        if (nameType === 0 && p + nameLen <= listEnd) {
          return new TextDecoder().decode(payload.slice(p, p + nameLen));
        }
        p += nameLen;
      }
    }

    offset += len;
  }

  return undefined;
}

function parseHttpMetadata(payload: Uint8Array) {
  const ascii = new TextDecoder().decode(payload.slice(0, 250));
  const requestMatch = ascii.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s]+)\s+HTTP\/\d\.\d/m);
  if (requestMatch) {
    const hostMatch = ascii.match(/^Host:\s*([^\r\n]+)/im);
    return {
      method: requestMatch[1],
      path: requestMatch[2],
      host: hostMatch?.[1]?.trim()
    };
  }

  const responseMatch = ascii.match(/^HTTP\/\d\.\d\s+(\d{3})/m);
  if (responseMatch) {
    return {
      statusCode: Number(responseMatch[1])
    };
  }

  return undefined;
}

function detectProtocol(protocolNumber: number): TransportProtocol {
  if (protocolNumber === 6) return 'TCP';
  if (protocolNumber === 17) return 'UDP';
  if (protocolNumber === 1) return 'ICMP';
  if (protocolNumber === 58) return 'ICMPv6';
  return 'OTHER';
}

const TCP_FLAG_MAP: Array<[number, string]> = [
  [0x01, 'FIN'],
  [0x02, 'SYN'],
  [0x04, 'RST'],
  [0x08, 'PSH'],
  [0x10, 'ACK'],
  [0x20, 'URG'],
  [0x40, 'ECE'],
  [0x80, 'CWR']
];

export function decodePacket(input: DecodeInput): PacketRecord | null {
  const network = parseNetworkLayer(input.packetData, input.linkType);
  if (!network) return null;

  const protocol = detectProtocol(network.protocolNumber);
  let srcPort: number | undefined;
  let dstPort: number | undefined;
  let tcpFlags: string[] | undefined;
  let dns: PacketRecord['dns'];
  let tls: PacketRecord['tls'];
  let http: PacketRecord['http'];

  const protocolStack: NetworkProtocol[] = [...network.protocolStack];

  if (protocol === 'TCP') {
    if (input.packetData.length < network.payloadOffset + 20) return null;
    srcPort = (input.packetData[network.payloadOffset] << 8) | input.packetData[network.payloadOffset + 1];
    dstPort = (input.packetData[network.payloadOffset + 2] << 8) | input.packetData[network.payloadOffset + 3];
    const dataOffset = (input.packetData[network.payloadOffset + 12] >> 4) * 4;
    const flagsByte = input.packetData[network.payloadOffset + 13];
    tcpFlags = TCP_FLAG_MAP.filter(([mask]) => (flagsByte & mask) !== 0).map(([, name]) => name);

    protocolStack.push('TCP');
    const appOffset = network.payloadOffset + dataOffset;
    const payload = input.packetData.slice(appOffset);

    if (srcPort === 53 || dstPort === 53) {
      dns = parseDnsMetadata(payload);
      protocolStack.push('DNS');
    }

    const likelyTlsPort = [443, 8443, 993, 995, 465, 853].includes(srcPort) ||
      [443, 8443, 993, 995, 465, 853].includes(dstPort);
    if (likelyTlsPort && payload.length >= 6 && payload[0] === 0x16) {
      const versionRaw = (payload[1] << 8) | payload[2];
      const handshakeType = payload[5];
      tls = {
        recordType: payload[0],
        version: parseTlsVersion(versionRaw),
        handshakeType,
        sni: handshakeType === 0x01 ? parseTlsSni(payload) : undefined
      };
      protocolStack.push('TLS');
    }

    const likelyHttpPort = [80, 8080, 8000, 3000, 5000].includes(srcPort) ||
      [80, 8080, 8000, 3000, 5000].includes(dstPort);
    if (likelyHttpPort && payload.length > 0) {
      const parsedHttp = parseHttpMetadata(payload);
      if (parsedHttp) {
        http = parsedHttp;
        protocolStack.push('HTTP');
      }
    }
  } else if (protocol === 'UDP') {
    if (input.packetData.length < network.payloadOffset + 8) return null;
    srcPort = (input.packetData[network.payloadOffset] << 8) | input.packetData[network.payloadOffset + 1];
    dstPort = (input.packetData[network.payloadOffset + 2] << 8) | input.packetData[network.payloadOffset + 3];
    protocolStack.push('UDP');

    const payload = input.packetData.slice(network.payloadOffset + 8);
    if (srcPort === 53 || dstPort === 53) {
      dns = parseDnsMetadata(payload);
      protocolStack.push('DNS');
    }
  } else if (protocol === 'ICMP' || protocol === 'ICMPv6') {
    protocolStack.push(protocol === 'ICMP' ? 'ICMP' : 'ICMPv6');
  }

  const service = inferService(srcPort, dstPort);
  const searchableBits = [
    network.srcIp,
    network.dstIp,
    srcPort?.toString(),
    dstPort?.toString(),
    protocol,
    service,
    dns?.query,
    tls?.sni,
    http?.host,
    http?.path,
    http?.method,
    tcpFlags?.join(',')
  ].filter(Boolean);

  return {
    id: input.packetId,
    timestampMs: input.timestampMs,
    length: input.originalLength,
    srcIp: network.srcIp,
    dstIp: network.dstIp,
    srcPort,
    dstPort,
    ipVersion: network.ipVersion,
    protocol,
    protocolStack,
    service,
    tcpFlags,
    dns,
    tls,
    http,
    info: dns?.query || tls?.sni || http?.path,
    rawSummary: searchableBits.join(' ').toLowerCase()
  };
}
