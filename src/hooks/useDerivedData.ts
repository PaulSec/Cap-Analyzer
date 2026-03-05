import { useMemo } from 'react';
import { useCaptureStore } from '@/store/captureStore';
import { applyPacketFilters, filterFlowsByPackets } from '@/lib/transformers/filters';
import { buildGraphFromPackets } from '@/lib/transformers/graph';
import { buildSummary } from '@/lib/transformers/summary';

export function useDerivedData() {
  const packets = useCaptureStore((s) => s.packets);
  const flows = useCaptureStore((s) => s.flows);
  const filters = useCaptureStore((s) => s.filters);
  const fileName = useCaptureStore((s) => s.fileName);

  const filteredPackets = useMemo(() => applyPacketFilters(packets, filters), [packets, filters]);
  const filteredPacketIds = useMemo(() => new Set(filteredPackets.map((p) => p.id)), [filteredPackets]);
  const filteredFlows = useMemo(() => filterFlowsByPackets(flows, filteredPacketIds), [flows, filteredPacketIds]);
  const graph = useMemo(() => buildGraphFromPackets(filteredPackets), [filteredPackets]);
  const summary = useMemo(() => buildSummary(fileName, filteredPackets, filteredFlows), [fileName, filteredPackets, filteredFlows]);

  return {
    filteredPackets,
    filteredFlows,
    graph,
    summary
  };
}
