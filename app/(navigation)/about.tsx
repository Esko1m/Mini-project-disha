import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>About</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.appName}>Disha</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.desc}>
          Disha uses WiFi signals already in the building to figure out where you are, and guides you with voice instructions. No GPS needed indoors.
        </Text>
        <Text style={styles.section}>How it works</Text>
        <Text style={styles.step}>1. Building staff walk the building once to teach the app the layout</Text>
        <Text style={styles.step}>2. You open the app and say where you want to go</Text>
        <Text style={styles.step}>3. The app guides you with voice, step by step</Text>
        <Text style={styles.note}>Building maps are cached after the first visit • Accessible with TalkBack/VoiceOver</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 24,
  },
  header: {
    marginTop: 48,
    marginBottom: 24,
  },
  back: {
    color: '#4a9eff',
    fontSize: 18,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  appName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  version: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  desc: {
    color: '#ccc',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    color: '#4a9eff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  step: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 12,
  },
  note: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
});
