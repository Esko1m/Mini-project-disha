import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { tts } from '../../lib/speech/tts';
import { setAppState } from '../../lib/storage/localDb';
import { useSettingsStore } from '../../store/settingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const haptics = useSettingsStore((s) => s.haptics);
  const screenOn = useSettingsStore((s) => s.screenOn);
  const muted = useSettingsStore((s) => s.muted);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const setScreenOn = useSettingsStore((s) => s.setScreenOn);
  const setMuted = useSettingsStore((s) => s.setMuted);

  useEffect(() => {
    tts.setMuted(muted);
    setAppState('setting_muted', muted ? '1' : '0').catch(() => {});
  }, [muted]);

  useEffect(() => {
    setAppState('setting_haptics', haptics ? '1' : '0').catch(() => {});
  }, [haptics]);

  useEffect(() => {
    setAppState('setting_screen_on', screenOn ? '1' : '0').catch(() => {});
  }, [screenOn]);

  const testVoice = () => {
    if (muted) {
      setMuted(false);
      tts.setMuted(false);
    }
    tts.speak('This is a test of the voice guidance system.', 'normal');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.section}>Voice Settings</Text>
        <SettingRow label="Mute voice" value={muted} onChange={setMuted} />
        <Pressable style={styles.button} onPress={testVoice} accessible accessibilityRole="button" accessibilityLabel="Test voice">
          <Text style={styles.buttonText}>Test Voice</Text>
        </Pressable>

        <Text style={styles.section}>Navigation</Text>
        <SettingRow label="Haptic feedback" value={haptics} onChange={setHaptics} />
        <SettingRow label="Keep screen on during navigation" value={screenOn} onChange={setScreenOn} />

        <Text style={styles.section}>About</Text>
        <Pressable style={styles.linkButton} onPress={() => router.push('/(navigation)/about')} accessible accessibilityRole="button" accessibilityLabel="About Disha">
          <Text style={styles.linkText}>About Disha →</Text>
        </Pressable>
        <Pressable style={styles.linkButton} onPress={() => router.push('/(surveyor)')} accessible accessibilityRole="button" accessibilityLabel="Surveyor mode">
          <Text style={styles.linkText}>Surveyor Mode →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
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
  section: {
    color: '#4a9eff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 17,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  linkText: {
    color: '#fff',
    fontSize: 17,
  },
});
