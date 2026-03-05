import { create } from 'zustand';
import { DEFAULT_FILTERS, EndpointRecord, FilterState, FlowRecord, PacketRecord, ParseProgress } from '@/types/network';

interface CaptureState {
  fileName?: string;
  packets: PacketRecord[];
  flows: FlowRecord[];
  endpoints: EndpointRecord[];
  progress: ParseProgress;
  filters: FilterState;
  selectedPacketId?: string;
  selectedFlowId?: string;
  selectedNodeIp?: string;
  setData: (params: {
    fileName?: string;
    packets: PacketRecord[];
    flows: FlowRecord[];
    endpoints: EndpointRecord[];
  }) => void;
  setProgress: (progress: ParseProgress) => void;
  updateFilters: (patch: Partial<FilterState>) => void;
  clearFilters: () => void;
  selectPacket: (id?: string) => void;
  selectFlow: (id?: string) => void;
  selectNode: (ip?: string) => void;
  focusOnNode: (ip: string, relatedOnly?: boolean) => void;
  traceFlow: (flow: FlowRecord) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  fileName: undefined,
  packets: [],
  flows: [],
  endpoints: [],
  progress: {
    status: 'idle',
    progressPct: 0,
    message: 'Drop a file or load demo data',
    warnings: []
  },
  filters: DEFAULT_FILTERS,
  selectedPacketId: undefined,
  selectedFlowId: undefined,
  selectedNodeIp: undefined,

  setData: ({ fileName, packets, flows, endpoints }) =>
    set({
      fileName,
      packets,
      flows,
      endpoints,
      selectedFlowId: undefined,
      selectedPacketId: undefined,
      selectedNodeIp: undefined,
      progress: {
        status: 'ready',
        progressPct: 100,
        message: `Loaded ${packets.length} packets`,
        warnings: []
      }
    }),

  setProgress: (progress) => set({ progress }),
  updateFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
  selectPacket: (selectedPacketId) => set({ selectedPacketId }),
  selectFlow: (selectedFlowId) => set({ selectedFlowId }),
  selectNode: (selectedNodeIp) => set({ selectedNodeIp }),
  focusOnNode: (ip, relatedOnly = true) =>
    set((state) => ({
      selectedNodeIp: ip,
      filters: {
        ...state.filters,
        focusIp: ip,
        ip,
        relatedOnly
      }
    })),
  traceFlow: (flow) =>
    set((state) => ({
      selectedFlowId: flow.id,
      filters: {
        ...state.filters,
        srcIp: flow.srcIp,
        dstIp: flow.dstIp,
        srcPort: flow.srcPort,
        dstPort: flow.dstPort,
        protocol: flow.protocol
      }
    }))
}));
