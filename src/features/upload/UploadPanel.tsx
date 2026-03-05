import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Panel } from '@/components/Panel';
import { ThemeColors } from '@/theme/colors';
import { UploadDropZone } from './UploadDropZone';
import { useCaptureStore } from '@/store/captureStore';
import { parseCaptureFile } from '@/lib/parsers/pcapParser';
import { buildFlows } from '@/lib/transformers/flows';
import { buildEndpoints, buildSummary } from '@/lib/transformers/summary';
import { buildMockCapture } from '@/lib/mock/sampleCapture';
import { formatBytes, formatDuration } from '@/lib/format';

interface Props {
  colors: ThemeColors;
}

export function UploadPanel({ colors }: Props) {
  const progress = useCaptureStore((s) => s.progress);
  const packets = useCaptureStore((s) => s.packets);
  const flows = useCaptureStore((s) => s.flows);
  const fileName = useCaptureStore((s) => s.fileName);
  const setData = useCaptureStore((s) => s.setData);
  const setProgress = useCaptureStore((s) => s.setProgress);

  const summary = useMemo(() => buildSummary(fileName, packets, flows), [fileName, packets, flows]);

  const onFile = async (file: File) => {
    setProgress({ status: 'parsing', progressPct: 0, message: `Parsing ${file.name}`, warnings: [] });
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parseCaptureFile(file.name, buf, setProgress);
      const flows = buildFlows(parsed.packets);
      const endpoints = buildEndpoints(parsed.packets);
      const summary = buildSummary(file.name, parsed.packets, flows);
      setData({ fileName: file.name, packets: parsed.packets, flows, endpoints });
      setProgress({
        status: 'ready',
        progressPct: 100,
        message: `Parsed ${summary.totalPackets} packets from ${file.name}`,
        warnings: parsed.warnings
      });
    } catch (error) {
      setProgress({
        status: 'error',
        progressPct: 0,
        message: error instanceof Error ? error.message : 'Failed to parse file',
        warnings: []
      });
    }
  };

  const loadDemo = () => {
    const mock = buildMockCapture();
    setData({ fileName: mock.summary.fileName, packets: mock.packets, flows: mock.flows, endpoints: mock.endpoints });
  };

  return (
    <Panel
      title="Upload & Controls"
      subtitle="Client-side parser (PCAP/PCAPNG). No data leaves your browser."
      colors={colors}
    >
      <UploadDropZone onFile={onFile} busy={progress.status === 'parsing'} />
      <View style={styles.row}>
        <Pressable style={[styles.button, { backgroundColor: colors.accentSoft }]} onPress={loadDemo}>
          <Text style={[styles.buttonText, { color: colors.accent }]}>Load demo capture</Text>
        </Pressable>
      </View>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: colors.subtleText }]}>Status:</Text>
        <Text style={[styles.statusText, { color: progress.status === 'error' ? colors.danger : colors.text }]}> 
          {progress.message || 'Idle'}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.accentSoft }]}>
        <View style={[styles.progressFill, { width: `${progress.progressPct}%`, backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Total packets" value={summary.totalPackets.toLocaleString()} colors={colors} />
        <SummaryCard label="Total flows" value={summary.totalFlows.toLocaleString()} colors={colors} />
        <SummaryCard label="Unique IPs" value={summary.uniqueIps.toLocaleString()} colors={colors} />
        <SummaryCard label="Capture duration" value={formatDuration(summary.durationMs)} colors={colors} />
        <SummaryCard label="Total bytes" value={formatBytes(summary.totalBytes)} colors={colors} />
        <SummaryCard
          label="Top protocols"
          value={summary.topProtocols.map((p) => `${p.protocol}:${p.count}`).join(', ') || 'N/A'}
          colors={colors}
        />
      </View>
      {progress.warnings.length > 0 ? (
        <View style={styles.warningBox}>
          <Text style={[styles.warningTitle, { color: colors.danger }]}>Parse warnings</Text>
          {progress.warnings.slice(0, 4).map((w, i) => (
            <Text key={`${w}-${i}`} style={[styles.warningText, { color: colors.subtleText }]}>
              {w}
            </Text>
          ))}
        </View>
      ) : null}
    </Panel>
  );
}

function SummaryCard({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Text style={[styles.cardLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.cardValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  buttonText: {
    fontWeight: '700'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    maxWidth: 240,
    flexGrow: 1,
    gap: 4
  },
  cardLabel: {
    fontSize: 12
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '700'
  },
  warningBox: {
    gap: 4
  },
  warningTitle: {
    fontWeight: '700',
    fontSize: 12
  },
  warningText: {
    fontSize: 12
  }
});
