import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { NetworkAnalyzerScreen } from './src/app/NetworkAnalyzerScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <NetworkAnalyzerScreen />
    </SafeAreaView>
  );
}
