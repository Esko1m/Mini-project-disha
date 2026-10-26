import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tts } from '../../lib/speech/tts';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    tts.speak('Welcome. This app helps you navigate indoors using your voice and WiFi signals.', 'normal');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Disha</Text>
        <Text style={styles.tagline}>Voice guided indoor navigation using WiFi</Text>
        <Text style={styles.description}>
          Navigate malls, hospitals, colleges and railway stations without looking at the screen. Just speak your destination.
        </Text>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/(onboarding)/permissions')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Get started"
        accessibilityHint="Go to permissions screen"
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'space-between',
    padding: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 16,
  },
  tagline: {
    color: '#4a9eff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  description: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
