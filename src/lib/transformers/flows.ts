import { FlowRecord, PacketRecord, TransportProtocol } from '@/types/network';

function flowKey(packet: PacketRecord): string {
  return [
    packet.srcIp,
    packet.dstIp,
    packet.srcPort ?? 0,
    packet.dstPort ?? 0,
    packet.protocol
  ].join('|');
}

export function buildFlows(packets: PacketRecord[]): FlowRecord[] {
  const map = new Map<string, FlowRecord>();

  for (const packet of packets) {
    const key = flowKey(packet);
    let flow = map.get(key);

    if (!flow) {
      flow = {
        id: `flow-${map.size}`,
        key,
        srcIp: packet.srcIp,
        dstIp: packet.dstIp,
        srcPort: packet.srcPort,
        dstPort: packet.dstPort,
        protocol: packet.protocol as TransportProtocol,
        service: packet.service,
        firstSeenMs: packet.timestampMs,
        lastSeenMs: packet.timestampMs,
        packetCount: 0,
        byteCount: 0,
        tcpFlagCounts: {},
        packetIds: []
      };
      map.set(key, flow);
    }

    flow.packetCount += 1;
    flow.byteCount += packet.length;
    flow.lastSeenMs = Math.max(flow.lastSeenMs, packet.timestampMs);
    flow.firstSeenMs = Math.min(flow.firstSeenMs, packet.timestampMs);
    flow.packetIds.push(packet.id);

    if (packet.tcpFlags) {
      for (const flag of packet.tcpFlags) {
        flow.tcpFlagCounts[flag] = (flow.tcpFlagCounts[flag] ?? 0) + 1;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.byteCount - a.byteCount);
}
