import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { useCaptureStore } from '@/store/captureStore';
import { TransportProtocol } from '@/types/network';

interface Props {
  colors: ThemeColors;
  availableServices: string[];
  minTs?: number;
  maxTs?: number;
}

const PROTOCOLS: Array<TransportProtocol | 'ANY'> = ['ANY', 'TCP', 'UDP', 'ICMP', 'ICMPv6', 'OTHER'];

export function FiltersPanel({ colors, availableServices, minTs, maxTs }: Props) {
  const filters = useCaptureStore((s) => s.filters);
  const updateFilters = useCaptureStore((s) => s.updateFilters);
  const clearFilters = useCaptureStore((s) => s.clearFilters);

  const timeRangeLabel = useMemo(() => {
    if (!filters.timeRange) return 'All time';
    return `${new Date(filters.timeRange.startMs).toLocaleTimeString()} - ${new Date(filters.timeRange.endMs).toLocaleTimeString()}`;
  }, [filters.timeRange]);

  return (
    <Panel title="Filters" subtitle="Graph, timeline, and flows table share these filters." colors={colors}>
      <View style={styles.grid}>
        <FilterInput label="Free text" value={filters.text} onChange={(v) => updateFilters({ text: v })} colors={colors} />
        <FilterInput label="Any IP" value={filters.ip} onChange={(v) => updateFilters({ ip: v })} colors={colors} />
        <FilterInput label="Source IP" value={filters.srcIp} onChange={(v) => updateFilters({ srcIp: v })} colors={colors} />
        <FilterInput label="Destination IP" value={filters.dstIp} onChange={(v) => updateFilters({ dstIp: v })} colors={colors} />
        <FilterInput
          label="Source port"
          value={filters.srcPort?.toString() ?? ''}
          onChange={(v) => updateFilters({ srcPort: v ? Number(v) : undefined })}
          colors={colors}
          keyboardType="numeric"
        />
        <FilterInput
          label="Destination port"
          value={filters.dstPort?.toString() ?? ''}
          onChange={(v) => updateFilters({ dstPort: v ? Number(v) : undefined })}
          colors={colors}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.rowWrap}>
        {PROTOCOLS.map((p) => {
          const active = filters.protocol === p;
          return (
            <Pressable
              key={p}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: active ? colors.accentSoft : colors.panel }
              ]}
              onPress={() => updateFilters({ protocol: p })}
            >
              <Text style={{ color: active ? colors.accent : colors.text, fontWeight: '600', fontSize: 12 }}>{p}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.rowWrap}>
        {availableServices.slice(0, 20).map((service) => {
          const active = filters.services.includes(service);
          return (
            <Pressable
              key={service}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: active ? colors.accentSoft : colors.panel }
              ]}
              onPress={() => {
                const current = new Set(filters.services);
                if (current.has(service)) current.delete(service);
                else current.add(service);
                updateFilters({ services: Array.from(current) });
              }}
            >
              <Text style={{ color: active ? colors.accent : colors.text, fontWeight: '600', fontSize: 12 }}>{service}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.accentSoft }]}
          onPress={() => {
            if (minTs === undefined || maxTs === undefined) return;
            const span = maxTs - minTs;
            updateFilters({ timeRange: { startMs: maxTs - span * 0.2, endMs: maxTs } });
          }}
        >
          <Text style={[styles.controlButtonText, { color: colors.accent }]}>Last 20%</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.panel }]}
          onPress={() => updateFilters({ relatedOnly: !filters.relatedOnly })}
        >
          <Text style={[styles.controlButtonText, { color: colors.text }]}>Related only: {filters.relatedOnly ? 'On' : 'Off'}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.panel }]}
          onPress={() => updateFilters({ timeRange: undefined })}
        >
          <Text style={[styles.controlButtonText, { color: colors.text }]}>Time: {timeRangeLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.panel }]}
          onPress={clearFilters}
        >
          <Text style={[styles.controlButtonText, { color: colors.text }]}>Clear all filters</Text>
        </Pressable>
      </View>
    </Panel>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  colors,
  keyboardType
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ThemeColors;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.subtleText }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.panel }]}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor={colors.subtleText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  inputWrap: {
    minWidth: 150,
    maxWidth: 220,
    flexGrow: 1,
    gap: 4
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  controlButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600'
  }
});
