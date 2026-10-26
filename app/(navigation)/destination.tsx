import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBuildingStore } from '../../store/buildingStore';
import { useNavigationStore } from '../../store/navigationStore';
import { findNearby, matchPoi } from '../../lib/navigation/poiMatcher';
import { tts } from '../../lib/speech/tts';
import { useVoiceInput } from '../../lib/speech/voiceInput';
import { parseIntent } from '../../lib/speech/intentParser';

export default function DestinationScreen() {
  const router = useRouter();
  const building = useBuildingStore();
  const nav = useNavigationStore();
  const { nearby } = useLocalSearchParams<{ nearby?: string }>();
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(building.pois);

  const basePois = useMemo(() => {
    if (nearby === '1' && nav.position) {
      const close = findNearby(
        nav.position.x,
        nav.position.y,
        nav.position.floor,
        building.pois,
        50
      );
      if (close.length > 0) return close;
    }
    return building.pois;
  }, [building.pois, nearby, nav.position]);

  useEffect(() => {
    setFiltered(basePois);
  }, [basePois]);

  useEffect(() => {
    if (!building.selectedBuilding) {
      tts.speak('Select a building first.', 'high');
      return;
    }
    tts.speak(
      nearby === '1'
        ? 'Showing nearby destinations. Choose one or speak it.'
        : 'Choose your destination or speak it.',
      'normal'
    );
  }, [nearby, building.selectedBuilding?.id]);

  useEffect(() => {
    if (!query) {
      setFiltered(basePois);
      return;
    }
    const lower = query.toLowerCase();
    setFiltered(
      basePois.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.aliases || []).some((a) => a.toLowerCase().includes(lower))
      )
    );
  }, [query, basePois]);

  const selectPoi = (poi: any) => {
    nav.startNavigation(poi);
    tts.speak(`Starting navigation to ${poi.name} on floor ${poi.floor}`, 'high');
    router.push('/(navigation)/navigate');
  };

  const onVoiceResult = (text: string) => {
    const intent = parseIntent(text);
    if (intent.type === 'navigate') {
      const poi = matchPoi(intent.destination, building.pois);
      if (poi) selectPoi(poi);
      else {
        setQuery(intent.destination);
        tts.speak('Showing matching destinations.', 'normal');
      }
    } else if (intent.type === 'stop') {
      router.back();
    }
  };

  const voice = useVoiceInput(onVoiceResult);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>
          {nearby === '1' ? 'Nearby Destinations' : 'Destinations'}
        </Text>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search or speak destination..."
        placeholderTextColor="#666"
        value={query}
        onChangeText={setQuery}
        accessible
        accessibilityLabel="Search destinations"
      />
      <Pressable
        style={[styles.voiceBtn, voice.isListening && styles.voiceBtnActive]}
        onPress={() => (voice.isListening ? voice.stop() : voice.start('en-IN'))}
        accessible
        accessibilityRole="button"
        accessibilityLabel={voice.isListening ? 'Stop listening' : 'Speak destination'}
      >
        <Text style={styles.voiceBtnText}>{voice.isListening ? '🎙️ Listening...' : '🎙️ Speak'}</Text>
      </Pressable>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => selectPoi(item)} accessible accessibilityRole="button" accessibilityLabel={`Navigate to ${item.name} on floor ${item.floor}`}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              Floor {item.floor} • {item.category || 'Place'}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>
              {building.selectedBuilding
                ? 'No destinations found'
                : 'No building selected'}
            </Text>
            {!building.selectedBuilding && (
              <Pressable
                style={styles.selectBtn}
                onPress={() => router.push('/(navigation)/buildings')}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Select a building"
              >
                <Text style={styles.selectText}>Select a Building</Text>
              </Pressable>
            )}
          </View>
        }
      />
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
    marginBottom: 16,
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
  search: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  voiceBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceBtnActive: {
    backgroundColor: '#d93025',
  },
  voiceBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#ccc',
    fontSize: 15,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  selectBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  selectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
