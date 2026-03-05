import { ParsedCapture } from '@/types/network';
import { buildFlows } from '@/lib/transformers/flows';
import { buildEndpoints, buildSummary } from '@/lib/transformers/summary';
import { PacketRecord } from '@/types/network';

const baseTime = Date.now() - 1000 * 60 * 10;

const mockPackets: PacketRecord[] = [
  {
    id: 'pkt-0',
    timestampMs: baseTime,
    length: 74,
    srcIp: '192.168.1.10',
    dstIp: '8.8.8.8',
    srcPort: 53001,
    dstPort: 53,
    ipVersion: 4,
    protocol: 'UDP',
    protocolStack: ['IPv4', 'UDP', 'DNS'],
    service: 'DNS',
    dns: { query: 'example.com', questionCount: 1, answerCount: 0 },
    info: 'example.com',
    rawSummary: '192.168.1.10 8.8.8.8 udp dns example.com 53001 53'
  },
  {
    id: 'pkt-1',
    timestampMs: baseTime + 100,
    length: 90,
    srcIp: '8.8.8.8',
    dstIp: '192.168.1.10',
    srcPort: 53,
    dstPort: 53001,
    ipVersion: 4,
    protocol: 'UDP',
    protocolStack: ['IPv4', 'UDP', 'DNS'],
    service: 'DNS',
    dns: { query: 'example.com', questionCount: 1, answerCount: 1 },
    info: 'example.com',
    rawSummary: '8.8.8.8 192.168.1.10 udp dns example.com 53 53001'
  },
  {
    id: 'pkt-2',
    timestampMs: baseTime + 400,
    length: 66,
    srcIp: '192.168.1.10',
    dstIp: '172.217.3.110',
    srcPort: 51000,
    dstPort: 443,
    ipVersion: 4,
    protocol: 'TCP',
    protocolStack: ['IPv4', 'TCP', 'TLS'],
    service: 'HTTPS',
    tcpFlags: ['SYN'],
    tls: { version: 'TLS1.2' },
    rawSummary: '192.168.1.10 172.217.3.110 tcp tls https 51000 443 syn'
  },
  {
    id: 'pkt-3',
    timestampMs: baseTime + 500,
    length: 66,
    srcIp: '172.217.3.110',
    dstIp: '192.168.1.10',
    srcPort: 443,
    dstPort: 51000,
    ipVersion: 4,
    protocol: 'TCP',
    protocolStack: ['IPv4', 'TCP', 'TLS'],
    service: 'HTTPS',
    tcpFlags: ['SYN', 'ACK'],
    tls: { version: 'TLS1.2' },
    rawSummary: '172.217.3.110 192.168.1.10 tcp tls https 443 51000 syn ack'
  },
  {
    id: 'pkt-4',
    timestampMs: baseTime + 600,
    length: 54,
    srcIp: '192.168.1.10',
    dstIp: '172.217.3.110',
    srcPort: 51000,
    dstPort: 443,
    ipVersion: 4,
    protocol: 'TCP',
    protocolStack: ['IPv4', 'TCP', 'TLS'],
    service: 'HTTPS',
    tcpFlags: ['ACK'],
    tls: { version: 'TLS1.3', sni: 'www.google.com' },
    info: 'www.google.com',
    rawSummary: '192.168.1.10 172.217.3.110 tcp tls https 51000 443 ack www.google.com'
  }
];

export function buildMockCapture(): ParsedCapture {
  const flows = buildFlows(mockPackets);
  const summary = buildSummary('mock-demo', mockPackets, flows);
  const endpoints = buildEndpoints(mockPackets);
  return { packets: mockPackets, flows, summary, endpoints };
}
