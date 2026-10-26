import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tts } from '../../lib/speech/tts';
import { setAppState } from '../../lib/storage/localDb';
import * as Location from 'expo-location';

export default function PermissionsScreen() {
  const router = useRouter();

  useEffect(() => {
    tts.speak('We need a few permissions. Microphone to speak your destination. Location to detect buildings. WiFi access to find your position.', 'normal');
  }, []);

  const requestAll = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
        );
      } catch {}
    }
    try {
      const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } catch {}
    try {
      await setAppState('onboarding_complete', '1');
    } catch {}
    tts.speak('Permissions requested. You can now start navigating.', 'normal');
    router.replace('/(navigation)');
  };

  const skip = async () => {
    try {
      await setAppState('onboarding_complete', '1');
    } catch {}
    router.replace('/(navigation)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>Needed for voice guidance and indoor positioning</Text>
      </View>
      <ScrollView style={styles.list}>
        <PermissionCard icon="🎙️" title="Microphone" reason="So you can speak your destination" />
        <PermissionCard icon="📍" title="Location" reason="To detect which building you are in" />
        <PermissionCard icon="📶" title="WiFi" reason="To figure out where you are inside the building" />
        <PermissionCard icon="🏃" title="Motion & Sensors" reason="To count your steps between WiFi updates" />
      </ScrollView>
      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={requestAll} accessible accessibilityRole="button" accessibilityLabel="Allow all permissions">
          <Text style={styles.primaryText}>Allow All</Text>
        </Pressable>
        <Pressable style={styles.skipButton} onPress={skip} accessible accessibilityRole="button" accessibilityLabel="Skip permissions">
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PermissionCard({ icon, title, reason }: { icon: string; title: string; reason: string }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${title}. ${reason}`}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardReason}>{reason}</Text>
      </View>
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
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardReason: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    marginBottom: 24,
  },
  primaryButton: {
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
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#aaa',
    fontSize: 16,
  },
});
