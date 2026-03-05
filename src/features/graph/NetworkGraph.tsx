import { Text } from 'react-native';
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

export function NetworkGraph({ colors, nodes, edges }: Props) {
  return (
    <Panel title="Interactive Graph" subtitle="Graph rendering is optimized for web in this MVP." colors={colors}>
      <Text style={{ color: colors.subtleText }}>
        Nodes: {nodes.length} | Edges: {edges.length}
      </Text>
    </Panel>
  );
}
