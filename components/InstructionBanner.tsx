import { StyleSheet, Text, View } from 'react-native';

interface InstructionBannerProps {
  instruction: string;
  distanceRemaining?: number;
  floor?: number;
}

export default function InstructionBanner({ instruction, distanceRemaining, floor }: InstructionBannerProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLiveRegion="assertive"
      accessibilityLabel={instruction}
    >
      <Text style={styles.instruction} numberOfLines={3}>
        {instruction || 'Calculating route...'}
      </Text>
      <View style={styles.metaRow}>
        {typeof distanceRemaining === 'number' && (
          <Text style={styles.meta}>Distance remaining: {distanceRemaining.toFixed(0)} m</Text>
        )}
        {typeof floor === 'number' && <Text style={styles.meta}>Floor: {floor}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  instruction: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  meta: {
    color: '#ccc',
    fontSize: 16,
  },
});
