import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { tts } from '../lib/speech/tts';
import { getAppState } from '../lib/storage/localDb';
import { useSettingsStore } from '../store/settingsStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [haptics, screenOn, muted] = await Promise.all([
          getAppState('setting_haptics'),
          getAppState('setting_screen_on'),
          getAppState('setting_muted'),
        ]);
        if (!active) return;

        const settings = useSettingsStore.getState();
        if (haptics !== null) settings.setHaptics(haptics === '1');
        if (screenOn !== null) settings.setScreenOn(screenOn === '1');
        if (muted !== null) {
          settings.setMuted(muted === '1');
          tts.setMuted(muted === '1');
        }
      } catch {
        // Fall back to the default settings if storage is unavailable.
      }

      if (!active) return;
      setReady(true);
      tts.speak(
        'Disha ready. Welcome to voice guided indoor navigation.',
        'normal'
      );
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#4a9eff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(navigation)" />
          <Stack.Screen name="(surveyor)" />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
});
