import { useMemo, useState } from 'react';
import { Appearance, ScrollView, StyleSheet, Text, useWindowDimensions, View, Pressable } from 'react-native';
import { UploadPanel } from '@/features/upload/UploadPanel';
import { FiltersPanel } from '@/features/filters/FiltersPanel';
import { NetworkGraph } from '@/features/graph/NetworkGraph';
import { TimelinePanel } from '@/features/timeline/TimelinePanel';
import { DetailsPanel } from '@/features/timeline/DetailsPanel';
import { FlowTable } from '@/features/flows/FlowTable';
import { TopTalkersPanel } from '@/features/flows/TopTalkersPanel';
import { DARK_THEME, LIGHT_THEME } from '@/theme/colors';
import { useCaptureStore } from '@/store/captureStore';
import { useDerivedData } from '@/hooks/useDerivedData';
import { buildEndpoints } from '@/lib/transformers/summary';

export function NetworkAnalyzerScreen() {
  const scheme = Appearance.getColorScheme();
  const [forceDark, setForceDark] = useState<boolean | undefined>(undefined);
  const dark = forceDark ?? scheme === 'dark';
  const colors = dark ? DARK_THEME : LIGHT_THEME;

  const { width } = useWindowDimensions();
  const isWide = width > 1200;
  const isMedium = width > 860;

  const selectedPacketId = useCaptureStore((s) => s.selectedPacketId);
  const selectedFlowId = useCaptureStore((s) => s.selectedFlowId);
  const selectedNodeIp = useCaptureStore((s) => s.selectedNodeIp);
  const selectPacket = useCaptureStore((s) => s.selectPacket);
  const selectFlow = useCaptureStore((s) => s.selectFlow);
  const selectNode = useCaptureStore((s) => s.selectNode);
  const focusOnNode = useCaptureStore((s) => s.focusOnNode);
  const traceFlow = useCaptureStore((s) => s.traceFlow);

  const { filteredPackets, filteredFlows, graph } = useDerivedData();
  const filteredEndpoints = useMemo(() => buildEndpoints(filteredPackets), [filteredPackets]);

  const selectedPacket = useMemo(
    () => filteredPackets.find((p) => p.id === selectedPacketId),
    [filteredPackets, selectedPacketId]
  );
  const selectedFlow = useMemo(() => filteredFlows.find((f) => f.id === selectedFlowId), [filteredFlows, selectedFlowId]);

  const services = useMemo(() => {
    const set = new Set<string>();
    for (const p of filteredPackets) {
      if (p.service) set.add(p.service);
    }
    return Array.from(set).sort();
  }, [filteredPackets]);

  const minTs = filteredPackets.length ? Math.min(...filteredPackets.map((p) => p.timestampMs)) : undefined;
  const maxTs = filteredPackets.length ? Math.max(...filteredPackets.map((p) => p.timestampMs)) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderColor: colors.border, backgroundColor: colors.panel }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Network Traffic Analyzer</Text>
          <Text style={[styles.subtitle, { color: colors.subtleText }]}>Local browser PCAP/PCAPNG metadata analysis and visualization</Text>
        </View>
        <Pressable
          style={[styles.themeBtn, { borderColor: colors.border }]}
          onPress={() => setForceDark((v) => (v === undefined ? !dark : !v))}
        >
          <Text style={[styles.themeText, { color: colors.text }]}>{dark ? 'Switch to light' : 'Switch to dark'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.layout, isWide ? styles.layoutWide : styles.layoutStack]}>
          <View style={[styles.col, isWide ? { flex: 1.1 } : { width: '100%' }]}>
            <UploadPanel colors={colors} />
            <TopTalkersPanel colors={colors} endpoints={filteredEndpoints} onFocusNode={focusOnNode} />
          </View>

          <View style={[styles.col, isWide ? { flex: 1.9 } : { width: '100%' }]}>
            <FiltersPanel colors={colors} availableServices={services} minTs={minTs} maxTs={maxTs} />
            <NetworkGraph
              colors={colors}
              nodes={graph.nodes}
              edges={graph.edges}
              selectedIp={selectedNodeIp}
              onSelectNode={selectNode}
              onFocusNode={focusOnNode}
            />
            <TimelinePanel
              colors={colors}
              packets={filteredPackets}
              selectedPacketId={selectedPacketId}
              onSelectPacket={selectPacket}
            />
            <FlowTable
              colors={colors}
              flows={filteredFlows}
              onSelectFlow={(flow) => selectFlow(flow.id)}
              onTraceFlow={traceFlow}
            />
          </View>

          <View style={[styles.col, isWide ? { flex: 1 } : isMedium ? { width: '100%' } : { width: '100%' }]}>
            <DetailsPanel colors={colors} packet={selectedPacket} flow={selectedFlow} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  title: {
    fontSize: 21,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  themeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  themeText: {
    fontWeight: '700',
    fontSize: 12
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 30
  },
  layout: {
    gap: 12
  },
  layoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  layoutStack: {
    flexDirection: 'column'
  },
  col: {
    gap: 12
  }
});
