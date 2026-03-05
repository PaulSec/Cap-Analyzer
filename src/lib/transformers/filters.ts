import { FilterState, FlowRecord, PacketRecord } from '@/types/network';

export function applyPacketFilters(packets: PacketRecord[], filters: FilterState): PacketRecord[] {
  return packets.filter((p) => {
    if (filters.ip && p.srcIp !== filters.ip && p.dstIp !== filters.ip) return false;
    if (filters.srcIp && p.srcIp !== filters.srcIp) return false;
    if (filters.dstIp && p.dstIp !== filters.dstIp) return false;
    if (filters.srcPort !== undefined && p.srcPort !== filters.srcPort) return false;
    if (filters.dstPort !== undefined && p.dstPort !== filters.dstPort) return false;
    if (filters.protocol !== 'ANY' && p.protocol !== filters.protocol) return false;
    if (filters.services.length && (!p.service || !filters.services.includes(p.service))) return false;
    if (filters.relatedOnly && filters.focusIp && p.srcIp !== filters.focusIp && p.dstIp !== filters.focusIp) {
      return false;
    }
    if (
      filters.timeRange &&
      (p.timestampMs < filters.timeRange.startMs || p.timestampMs > filters.timeRange.endMs)
    ) {
      return false;
    }
    if (filters.text) {
      const t = filters.text.trim().toLowerCase();
      if (t && !p.rawSummary.includes(t)) return false;
    }
    return true;
  });
}

export function filterFlowsByPackets(flows: FlowRecord[], packetIds: Set<string>): FlowRecord[] {
  return flows.filter((flow) => flow.packetIds.some((id) => packetIds.has(id)));
}
