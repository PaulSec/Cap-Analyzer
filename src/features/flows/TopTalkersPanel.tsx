import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { EndpointRecord } from '@/types/network';
import { formatBytes } from '@/lib/format';

interface Props {
  colors: ThemeColors;
  endpoints: EndpointRecord[];
  onFocusNode: (ip: string) => void;
}

export function TopTalkersPanel({ colors, endpoints, onFocusNode }: Props) {
  return (
    <Panel title="Top Talkers" subtitle="Highest-volume endpoints in current dataset." colors={colors}>
      <View style={styles.wrap}>
        {endpoints.slice(0, 8).map((e) => (
          <Pressable
            key={e.ip}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.panel }]}
            onPress={() => onFocusNode(e.ip)}
          >
            <Text style={[styles.ip, { color: colors.text }]}>{e.ip}</Text>
            <Text style={[styles.meta, { color: colors.subtleText }]}>
              {e.packetCount} packets | {formatBytes(e.byteCount)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6
  },
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 2
  },
  ip: {
    fontSize: 12,
    fontWeight: '700'
  },
  meta: {
    fontSize: 11
  }
});
