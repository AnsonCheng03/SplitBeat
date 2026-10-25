import { View } from 'react-native';

/** A quiet span marker that makes the shared rhythmic duration visible. */
export function BeatDurationGuide({ width, color }: { width: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: 8, opacity: 0.34 }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: 3.5, height: 1, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 8, backgroundColor: color }} />
      <View style={{ position: 'absolute', right: 0, top: 0, width: 1, height: 8, backgroundColor: color }} />
    </View>
  );
}
