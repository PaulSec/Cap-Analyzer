import { StyleSheet, Text, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { FlowRecord, PacketRecord } from '@/types/network';
import { formatTs } from '@/lib/format';

interface Props {
  colors: ThemeColors;
  packet?: PacketRecord;
  flow?: FlowRecord;
}

export function DetailsPanel({ colors, packet, flow }: Props) {
  return (
    <Panel title="Details" subtitle="Selection details for packet or flow." colors={colors}>
      {packet ? (
        <View style={styles.block}>
          <Text style={[styles.head, { color: colors.text }]}>Packet {packet.id}</Text>
          <KV k="Timestamp" v={formatTs(packet.timestampMs)} colors={colors} />
          <KV k="Source" v={`${packet.srcIp}:${packet.srcPort ?? '-'}`} colors={colors} />
          <KV k="Destination" v={`${packet.dstIp}:${packet.dstPort ?? '-'}`} colors={colors} />
          <KV k="Protocol" v={packet.protocol} colors={colors} />
          <KV k="Length" v={`${packet.length}`} colors={colors} />
          <KV k="Service" v={packet.service ?? '-'} colors={colors} />
          <KV k="TCP Flags" v={packet.tcpFlags?.join(', ') ?? '-'} colors={colors} />
          <KV k="Info" v={packet.info ?? '-'} colors={colors} />
        </View>
      ) : null}
      {flow ? (
        <View style={styles.block}>
          <Text style={[styles.head, { color: colors.text }]}>Flow {flow.id}</Text>
          <KV k="5-tuple" v={`${flow.srcIp}:${flow.srcPort ?? '-'} -> ${flow.dstIp}:${flow.dstPort ?? '-'} ${flow.protocol}`} colors={colors} />
          <KV k="Packets" v={`${flow.packetCount}`} colors={colors} />
          <KV k="Bytes" v={`${flow.byteCount}`} colors={colors} />
          <KV k="Service" v={flow.service ?? '-'} colors={colors} />
          <KV k="First seen" v={formatTs(flow.firstSeenMs)} colors={colors} />
          <KV k="Last seen" v={formatTs(flow.lastSeenMs)} colors={colors} />
        </View>
      ) : null}
      {!packet && !flow ? <Text style={{ color: colors.subtleText }}>Select a packet, flow, or graph node.</Text> : null}
    </Panel>
  );
}

function KV({ k, v, colors }: { k: string; v: string; colors: ThemeColors }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.k, { color: colors.subtleText }]}>{k}</Text>
      <Text style={[styles.v, { color: colors.text }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6
  },
  head: {
    fontWeight: '800',
    fontSize: 14
  },
  kv: {
    gap: 2
  },
  k: {
    fontSize: 11,
    fontWeight: '600'
  },
  v: {
    fontSize: 12
  }
});
