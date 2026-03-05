import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/theme/colors';

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  colors: ThemeColors;
}

export function Panel({ title, subtitle, colors, children }: PanelProps) {
  return (
    <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.subtleText }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12
  },
  header: {
    gap: 4
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 12
  }
});
