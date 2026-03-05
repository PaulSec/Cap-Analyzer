import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { PacketRecord } from '@/types/network';
import { formatTs } from '@/lib/format';

interface Props {
  colors: ThemeColors;
  packets: PacketRecord[];
  selectedPacketId?: string;
  onSelectPacket: (id: string) => void;
}

export function TimelinePanel({ colors, packets, selectedPacketId, onSelectPacket }: Props) {
  const sorted = useMemo(() => [...packets].sort((a, b) => a.timestampMs - b.timestampMs).slice(0, 5000), [packets]);
  const min = sorted[0]?.timestampMs;
  const max = sorted[sorted.length - 1]?.timestampMs;

  return (
    <Panel title="Timeline & Packet Sequence" subtitle="Chronological packet list with interaction sequence." colors={colors}>
      <View style={[styles.timelineTrack, { backgroundColor: colors.accentSoft }]}>
        {sorted.slice(0, 120).map((p) => {
          const ratio = min !== undefined && max !== undefined && max > min ? (p.timestampMs - min) / (max - min) : 0;
          return (
            <View
              key={`dot-${p.id}`}
              style={[
                styles.dot,
                {
                  left: `${ratio * 100}%`,
                  backgroundColor: p.protocol === 'TCP' ? '#dd7a00' : p.protocol === 'UDP' ? '#0f8f67' : '#6f5fae'
                }
              ]}
            />
          );
        })}
      </View>
      <ScrollView style={{ maxHeight: 260 }}>
        {sorted.slice(0, 600).map((p) => {
          const selected = p.id === selectedPacketId;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelectPacket(p.id)}
              style={[
                styles.packetRow,
                { borderColor: colors.border, backgroundColor: selected ? colors.accentSoft : colors.panel }
              ]}
            >
              <Text style={[styles.packetTs, { color: colors.subtleText }]}>{formatTs(p.timestampMs)}</Text>
              <Text style={[styles.packetMain, { color: colors.text }]}>
                {p.srcIp}:{p.srcPort ?? '-'} {'->'} {p.dstIp}:{p.dstPort ?? '-'} {p.protocol}
              </Text>
              <Text style={[styles.packetSub, { color: colors.subtleText }]}>Len {p.length} | {p.service ?? 'Unknown'} | {p.info ?? '-'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Panel>
  );
}

const styles = StyleSheet.create({
  timelineTrack: {
    position: 'relative',
    height: 30,
    borderRadius: 999,
    overflow: 'hidden'
  },
  dot: {
    position: 'absolute',
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 8
  },
  packetRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    gap: 2
  },
  packetTs: {
    fontSize: 11,
    fontWeight: '600'
  },
  packetMain: {
    fontSize: 12,
    fontWeight: '700'
  },
  packetSub: {
    fontSize: 11
  }
});
