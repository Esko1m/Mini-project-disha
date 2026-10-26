import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigationStore } from '../../store/navigationStore';
import { useSettingsStore } from '../../store/settingsStore';
import { tts } from '../../lib/speech/tts';
import * as Haptics from 'expo-haptics';

export default function ArrivedScreen() {
  const router = useRouter();
  const nav = useNavigationStore();

  useEffect(() => {
    tts.speak(`You have reached ${nav.destination?.name || 'your destination'}.`, 'urgent');
    if (useSettingsStore.getState().haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  const goHome = () => {
    nav.stopNavigation();
    router.replace('/(navigation)');
  };

  const goElsewhere = () => {
    nav.stopNavigation();
    router.replace('/(navigation)/destination');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>You have arrived</Text>
        <Text style={styles.destination}>{nav.destination?.name || 'Destination'}</Text>
        <Text style={styles.floor}>Floor {nav.destination?.floor || nav.currentFloor}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={goElsewhere} accessible accessibilityRole="button" accessibilityLabel="Navigate somewhere else">
          <Text style={styles.primaryText}>Navigate Somewhere Else</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={goHome} accessible accessibilityRole="button" accessibilityLabel="Go to home">
          <Text style={styles.secondaryText}>Home</Text>
        </Pressable>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  destination: {
    color: '#4a9eff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  floor: {
    color: '#ccc',
    fontSize: 18,
    marginTop: 8,
  },
  actions: {
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#aaa',
    fontSize: 16,
  },
});
