import * as DocumentPicker from 'expo-document-picker';
import { Pressable, StyleSheet, Text } from 'react-native';

interface UploadDropZoneProps {
  onFile: (file: File) => void;
  busy?: boolean;
}

export function UploadDropZone({ onFile, busy }: UploadDropZoneProps) {
  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/octet-stream'] });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    if (!asset.file) return;
    onFile(asset.file as File);
  };

  return (
    <Pressable style={[styles.box, busy && styles.disabled]} onPress={pick}>
      <Text style={styles.head}>Select .pcap / .pcapng file</Text>
      <Text style={styles.sub}>Browser drag-and-drop is available on web.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#8aa5c8',
    borderRadius: 12,
    padding: 20,
    gap: 8,
    backgroundColor: '#f9fbff'
  },
  disabled: {
    opacity: 0.6
  },
  head: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34455f'
  },
  sub: {
    fontSize: 13,
    color: '#596e8e'
  }
});
