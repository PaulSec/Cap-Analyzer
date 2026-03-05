import { CaptureSummary, EndpointRecord, FlowRecord, PacketRecord } from '@/types/network';

export function buildEndpoints(packets: PacketRecord[]): EndpointRecord[] {
  const map = new Map<string, EndpointRecord>();

  for (const p of packets) {
    if (!map.has(p.srcIp)) {
      map.set(p.srcIp, { ip: p.srcIp, packetCount: 0, byteCount: 0, inPackets: 0, outPackets: 0 });
    }
    if (!map.has(p.dstIp)) {
      map.set(p.dstIp, { ip: p.dstIp, packetCount: 0, byteCount: 0, inPackets: 0, outPackets: 0 });
    }

    const src = map.get(p.srcIp)!;
    const dst = map.get(p.dstIp)!;
    src.packetCount += 1;
    src.byteCount += p.length;
    src.outPackets += 1;
    dst.packetCount += 1;
    dst.byteCount += p.length;
    dst.inPackets += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.byteCount - a.byteCount);
}

export function buildSummary(fileName: string | undefined, packets: PacketRecord[], flows: FlowRecord[]): CaptureSummary {
  const protocolCounts = new Map<string, number>();
  let totalBytes = 0;
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;

  for (const p of packets) {
    totalBytes += p.length;
    start = Math.min(start, p.timestampMs);
    end = Math.max(end, p.timestampMs);
    const key = p.protocol;
    protocolCounts.set(key, (protocolCounts.get(key) ?? 0) + 1);
  }

  const uniqueIps = new Set<string>();
  for (const p of packets) {
    uniqueIps.add(p.srcIp);
    uniqueIps.add(p.dstIp);
  }

  const topProtocols = Array.from(protocolCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([protocol, count]) => ({ protocol, count }));

  const hasPackets = packets.length > 0;

  return {
    fileName,
    totalPackets: packets.length,
    totalFlows: flows.length,
    uniqueIps: uniqueIps.size,
    topProtocols,
    captureStartMs: hasPackets ? start : undefined,
    captureEndMs: hasPackets ? end : undefined,
    durationMs: hasPackets ? Math.max(0, end - start) : 0,
    totalBytes
  };
}
