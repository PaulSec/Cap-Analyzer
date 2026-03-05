export type TransportProtocol = 'TCP' | 'UDP' | 'ICMP' | 'ICMPv6' | 'OTHER';

export type NetworkProtocol =
  | 'IPv4'
  | 'IPv6'
  | 'TCP'
  | 'UDP'
  | 'ICMP'
  | 'ICMPv6'
  | 'DNS'
  | 'TLS'
  | 'HTTP'
  | 'UNKNOWN';

export type ParseStatus = 'idle' | 'parsing' | 'ready' | 'error';

export interface PacketRecord {
  id: string;
  timestampMs: number;
  length: number;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  ipVersion?: 4 | 6;
  protocol: TransportProtocol;
  protocolStack: NetworkProtocol[];
  service?: string;
  tcpFlags?: string[];
  dns?: {
    query?: string;
    responseCode?: number;
    answerCount?: number;
    questionCount?: number;
  };
  tls?: {
    recordType?: number;
    version?: string;
    handshakeType?: number;
    sni?: string;
  };
  http?: {
    method?: string;
    host?: string;
    path?: string;
    statusCode?: number;
  };
  info?: string;
  rawSummary: string;
}

export interface FlowRecord {
  id: string;
  key: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: TransportProtocol;
  service?: string;
  firstSeenMs: number;
  lastSeenMs: number;
  packetCount: number;
  byteCount: number;
  tcpFlagCounts: Record<string, number>;
  packetIds: string[];
}

export interface EndpointRecord {
  ip: string;
  packetCount: number;
  byteCount: number;
  inPackets: number;
  outPackets: number;
}

export interface GraphNode {
  id: string;
  label: string;
  ip: string;
  packetCount: number;
  byteCount: number;
  degree: number;
  protocols: NetworkProtocol[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  packetCount: number;
  byteCount: number;
  protocols: NetworkProtocol[];
  services: string[];
  flowIds: string[];
}

export interface CaptureSummary {
  fileName?: string;
  totalPackets: number;
  totalFlows: number;
  uniqueIps: number;
  topProtocols: Array<{ protocol: string; count: number }>;
  captureStartMs?: number;
  captureEndMs?: number;
  durationMs: number;
  totalBytes: number;
}

export interface ParseProgress {
  status: ParseStatus;
  progressPct: number;
  message?: string;
  warnings: string[];
}

export interface ParsedCapture {
  packets: PacketRecord[];
  flows: FlowRecord[];
  summary: CaptureSummary;
  endpoints: EndpointRecord[];
}

export interface FilterState {
  text: string;
  ip: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: TransportProtocol | 'ANY';
  services: string[];
  timeRange?: { startMs: number; endMs: number };
  focusIp?: string;
  relatedOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  text: '',
  ip: '',
  srcIp: '',
  dstIp: '',
  protocol: 'ANY',
  services: [],
  relatedOnly: false
};
