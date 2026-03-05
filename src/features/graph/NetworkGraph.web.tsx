import { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import * as d3 from 'd3';
import { GraphEdge, GraphNode } from '@/types/network';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';

interface Props {
  colors: ThemeColors;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedIp?: string;
  onSelectNode: (ip?: string) => void;
  onFocusNode: (ip: string) => void;
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#dd7a00',
  UDP: '#0f8f67',
  ICMP: '#a53b83',
  DNS: '#0b6bcb',
  TLS: '#1876c9',
  HTTP: '#6d35bc',
  UNKNOWN: '#6d7688'
};

export function NetworkGraph({ colors, nodes, edges, selectedIp, onSelectNode, onFocusNode }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const legend = useMemo(() => Object.entries(PROTOCOL_COLORS), []);

  useEffect(() => {
    if (!svgRef.current || !hostRef.current) return;

    const width = Math.max(640, hostRef.current.clientWidth - 20);
    const height = 380;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const root = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 4]).on('zoom', (event) => {
      root.attr('transform', event.transform.toString());
    });
    svg.call(zoom as any);

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges as any).id((d: any) => d.id).distance(100).strength(0.2))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => Math.max(8, Math.sqrt(d.packetCount) + 4)));

    const edge = root
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#90a2bc')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d) => Math.max(1, Math.log10(d.packetCount + 1) * 2));

    const node = root
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => Math.max(7, Math.min(20, Math.sqrt(d.packetCount) + 4)))
      .attr('fill', (d) => (d.ip === selectedIp ? colors.accent : '#3b7fc4'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        onSelectNode(d.ip);
      })
      .on('dblclick', (_, d) => {
        onFocusNode(d.ip);
      })
      .append('title')
      .text((d) => `${d.ip}\nPackets: ${d.packetCount}\nBytes: ${d.byteCount}`);

    const labels = root
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.ip)
      .attr('font-size', 10)
      .attr('fill', colors.text)
      .attr('dx', 10)
      .attr('dy', 3);

    simulation.on('tick', () => {
      edge
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      svg
        .selectAll('circle')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, colors.accent, colors.text, onFocusNode, onSelectNode, selectedIp]);

  const selectedNode = selectedIp ? nodes.find((n) => n.ip === selectedIp) : undefined;

  return (
    <Panel
      title="Interactive Graph"
      subtitle="Click node to inspect. Double-click to focus and show related traffic. Mouse wheel for zoom."
      colors={colors}
    >
      <View ref={hostRef as any} style={{ width: '100%', minHeight: 380 }}>
        <svg ref={svgRef} style={{ width: '100%', height: 380, borderRadius: 10, background: colors.accentSoft }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {legend.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: v }} />
            <Text style={{ color: colors.subtleText, fontSize: 12 }}>{k}</Text>
          </View>
        ))}
      </View>
      {selectedNode ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{selectedNode.ip}</Text>
          <Text style={{ color: colors.subtleText, fontSize: 12 }}>Packets: {selectedNode.packetCount}</Text>
          <Text style={{ color: colors.subtleText, fontSize: 12 }}>Bytes: {selectedNode.byteCount}</Text>
        </View>
      ) : null}
    </Panel>
  );
}
