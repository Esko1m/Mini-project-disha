import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import VoiceButton from '../../components/VoiceButton';
import { useVoiceInput } from '../../lib/speech/voiceInput';
import { parseIntent } from '../../lib/speech/intentParser';
import { tts } from '../../lib/speech/tts';
import { useNavigationStore } from '../../store/navigationStore';
import { useBuildingStore } from '../../store/buildingStore';
import { matchPoi } from '../../lib/navigation/poiMatcher';

export default function HomeScreen() {
  const router = useRouter();
  const nav = useNavigationStore();
  const building = useBuildingStore();
  const [buildingName, setBuildingName] = useState('Select a building');

  const onVoiceResult = (text: string) => {
    const intent = parseIntent(text);
    if (
      !building.selectedBuilding &&
      (intent.type === 'navigate' || intent.type === 'whats_around')
    ) {
      tts.speak('Please select a building first.', 'high');
      router.push('/(navigation)/buildings');
      return;
    }
    if (intent.type === 'navigate') {
      const poi = matchPoi(intent.destination, building.pois);
      if (poi) {
        nav.startNavigation(poi);
        tts.speak(`Starting navigation to ${poi.name}`, 'high');
        router.push('/(navigation)/navigate');
      } else {
        tts.speak(`I couldn't find ${intent.destination} in this building. Showing destination list.`, 'normal');
        router.push('/(navigation)/destination');
      }
    } else if (intent.type === 'where_am_i') {
      if (nav.position) {
        tts.speak(`You are at floor ${nav.position.floor} near x ${Math.round(nav.position.x)}, y ${Math.round(nav.position.y)}`, 'normal');
      } else {
        tts.speak('I am still figuring out your location. Please wait.', 'normal');
      }
    } else if (intent.type === 'help') {
      tts.speak('You can say Navigate to a place, Where am I, Repeat, How far, Stop, or What is around me.', 'normal');
    } else if (intent.type === 'whats_around') {
      tts.speak('Showing nearby places.', 'normal');
      router.push({ pathname: '/(navigation)/destination', params: { nearby: '1' } });
    } else {
      tts.speak('I did not understand. Try saying Navigate to pharmacy, or tap the microphone.', 'normal');
    }
  };

  const voice = useVoiceInput(onVoiceResult);

  useEffect(() => {
    if (building.selectedBuilding) {
      setBuildingName(building.selectedBuilding.name);
      tts.speak(`You are at ${building.selectedBuilding.name}. Say Navigate To, or tap the mic button.`, 'normal');
    } else {
      setBuildingName('Select a building');
      tts.speak('Select a building to start navigation.', 'normal');
    }
  }, [building.selectedBuilding?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.buildingName} numberOfLines={1}>
          {buildingName}
        </Text>
        <Pressable onPress={() => router.push('/(navigation)/buildings')} accessible accessibilityRole="button" accessibilityLabel="Change building">
          <Text style={styles.change}>Change Building</Text>
        </Pressable>
      </View>
      <View style={styles.center}>
        <VoiceButton isListening={voice.isListening} onPress={() => (voice.isListening ? voice.stop() : voice.start('en-IN'))} />
        <Text style={styles.prompt}>Say where you want to go</Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.destButton} onPress={() => router.push('/(navigation)/destination')} accessible accessibilityRole="button" accessibilityLabel="Browse destinations">
          <Text style={styles.destText}>Browse Destinations</Text>
        </Pressable>
        <Pressable style={styles.settingsButton} onPress={() => router.push('/(navigation)/settings')} accessible accessibilityRole="button" accessibilityLabel="Settings">
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
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
    marginTop: 48,
    alignItems: 'center',
  },
  buildingName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  change: {
    color: '#4a9eff',
    fontSize: 16,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    color: '#ccc',
    fontSize: 20,
    marginTop: 24,
  },
  footer: {
    marginBottom: 32,
  },
  destButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  destText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  settingsText: {
    color: '#aaa',
    fontSize: 16,
  },
});
