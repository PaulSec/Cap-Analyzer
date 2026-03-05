import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { FlowRecord } from '@/types/network';
import { formatBytes, formatTs } from '@/lib/format';

interface Props {
  colors: ThemeColors;
  flows: FlowRecord[];
  onSelectFlow: (flow: FlowRecord) => void;
  onTraceFlow: (flow: FlowRecord) => void;
}

export function FlowTable({ colors, flows, onSelectFlow, onTraceFlow }: Props) {
  const [sortBy, setSortBy] = useState<'packets' | 'bytes' | 'lastSeen'>('bytes');

  const sorted = useMemo(() => {
    const copy = [...flows];
    if (sortBy === 'packets') copy.sort((a, b) => b.packetCount - a.packetCount);
    if (sortBy === 'bytes') copy.sort((a, b) => b.byteCount - a.byteCount);
    if (sortBy === 'lastSeen') copy.sort((a, b) => b.lastSeenMs - a.lastSeenMs);
    return copy.slice(0, 2000);
  }, [flows, sortBy]);

  const exportCsv = () => {
    const headers = ['srcIp', 'dstIp', 'srcPort', 'dstPort', 'protocol', 'service', 'packets', 'bytes', 'firstSeen', 'lastSeen'];
    const rows = sorted.map((f) => [
      f.srcIp,
      f.dstIp,
      f.srcPort ?? '',
      f.dstPort ?? '',
      f.protocol,
      f.service ?? '',
      f.packetCount,
      f.byteCount,
      formatTs(f.firstSeenMs),
      formatTs(f.lastSeenMs)
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');

    if (typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filtered_flows.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Panel title="Flow Table" subtitle="Sortable and exportable filtered conversations." colors={colors}>
      <View style={styles.toolbar}>
        <SortButton label="Sort: bytes" active={sortBy === 'bytes'} onPress={() => setSortBy('bytes')} colors={colors} />
        <SortButton
          label="Sort: packets"
          active={sortBy === 'packets'}
          onPress={() => setSortBy('packets')}
          colors={colors}
        />
        <SortButton
          label="Sort: last seen"
          active={sortBy === 'lastSeen'}
          onPress={() => setSortBy('lastSeen')}
          colors={colors}
        />
        <Pressable style={[styles.btn, { borderColor: colors.border }]} onPress={exportCsv}>
          <Text style={[styles.btnText, { color: colors.text }]}>Export CSV</Text>
        </Pressable>
      </View>

      <ScrollView style={{ maxHeight: 280 }}>
        <View style={[styles.tableHead, { borderColor: colors.border }]}>
          {['Source', 'Destination', 'Proto', 'Svc', 'Packets', 'Bytes', 'Actions'].map((h) => (
            <Text key={h} style={[styles.headCell, { color: colors.subtleText }]}>
              {h}
            </Text>
          ))}
        </View>
        {sorted.map((flow) => (
          <View key={flow.id} style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.cell, { color: colors.text }]}>{flow.srcIp}:{flow.srcPort ?? '-'}</Text>
            <Text style={[styles.cell, { color: colors.text }]}>{flow.dstIp}:{flow.dstPort ?? '-'}</Text>
            <Text style={[styles.cell, { color: colors.text }]}>{flow.protocol}</Text>
            <Text style={[styles.cell, { color: colors.text }]}>{flow.service ?? '-'}</Text>
            <Text style={[styles.cell, { color: colors.text }]}>{flow.packetCount}</Text>
            <Text style={[styles.cell, { color: colors.text }]}>{formatBytes(flow.byteCount)}</Text>
            <View style={[styles.actionsCell]}>
              <Pressable onPress={() => onSelectFlow(flow)}>
                <Text style={[styles.actionText, { color: colors.accent }]}>Inspect</Text>
              </Pressable>
              <Pressable onPress={() => onTraceFlow(flow)}>
                <Text style={[styles.actionText, { color: colors.accent }]}>Trace</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </Panel>
  );
}

function SortButton({
  label,
  active,
  onPress,
  colors
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable style={[styles.btn, { borderColor: colors.border, backgroundColor: active ? colors.accentSoft : colors.panel }]} onPress={onPress}>
      <Text style={[styles.btnText, { color: active ? colors.accent : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8
  },
  headCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8
  },
  cell: {
    flex: 1,
    fontSize: 12
  },
  actionsCell: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
