import { GraphEdge, GraphNode, PacketRecord } from '@/types/network';

export function buildGraphFromPackets(packets: PacketRecord[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const p of packets) {
    if (!nodes.has(p.srcIp)) {
      nodes.set(p.srcIp, {
        id: p.srcIp,
        label: p.srcIp,
        ip: p.srcIp,
        packetCount: 0,
        byteCount: 0,
        degree: 0,
        protocols: []
      });
    }
    if (!nodes.has(p.dstIp)) {
      nodes.set(p.dstIp, {
        id: p.dstIp,
        label: p.dstIp,
        ip: p.dstIp,
        packetCount: 0,
        byteCount: 0,
        degree: 0,
        protocols: []
      });
    }

    const srcNode = nodes.get(p.srcIp)!;
    const dstNode = nodes.get(p.dstIp)!;
    srcNode.packetCount += 1;
    srcNode.byteCount += p.length;
    dstNode.packetCount += 1;
    dstNode.byteCount += p.length;

    for (const proto of p.protocolStack) {
      if (!srcNode.protocols.includes(proto)) srcNode.protocols.push(proto);
      if (!dstNode.protocols.includes(proto)) dstNode.protocols.push(proto);
    }

    const edgeKey = `${p.srcIp}->${p.dstIp}`;
    if (!edges.has(edgeKey)) {
      edges.set(edgeKey, {
        id: edgeKey,
        source: p.srcIp,
        target: p.dstIp,
        packetCount: 0,
        byteCount: 0,
        protocols: [],
        services: [],
        flowIds: []
      });
    }

    const edge = edges.get(edgeKey)!;
    edge.packetCount += 1;
    edge.byteCount += p.length;
    for (const proto of p.protocolStack) {
      if (!edge.protocols.includes(proto)) edge.protocols.push(proto);
    }
    if (p.service && !edge.services.includes(p.service)) edge.services.push(p.service);
  }

  for (const edge of edges.values()) {
    nodes.get(edge.source)!.degree += 1;
    nodes.get(edge.target)!.degree += 1;
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values())
  };
}
