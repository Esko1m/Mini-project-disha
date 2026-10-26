import { Pressable, StyleSheet, Text, View } from 'react-native';

interface VoiceButtonProps {
  isListening: boolean;
  onPress: () => void;
  label?: string;
}

export default function VoiceButton({ isListening, onPress, label = 'Tap to speak' }: VoiceButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, isListening && styles.buttonListening]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Listening, tap to stop' : 'Voice input, tap to speak your destination'}
      accessibilityHint="Activates speech recognition"
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>🎙️</Text>
        <Text style={styles.label}>{isListening ? 'Listening...' : label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonListening: {
    backgroundColor: '#d93025',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    marginTop: 8,
    fontWeight: '600',
  },
});
