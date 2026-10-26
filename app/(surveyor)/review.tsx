import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteSurveyDraft, getSurveyDrafts } from '../../lib/storage/localDb';
import { recordFingerprint, trainBuilding } from '../../lib/api/buildings';
import { clearFingerprintCache } from '../../lib/api/locate';
import { useSurveyStore } from '../../store/surveyStore';
import { tts } from '../../lib/speech/tts';

export default function ReviewRecordingsScreen() {
  const router = useRouter();
  const survey = useSurveyStore();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const d = await getSurveyDrafts(survey.buildingId || 'demo-mall', survey.floor);
      setDrafts(d);
    } catch {
      setDrafts([]);
    }
  };

  useEffect(() => {
    load();
    tts.speak('Review recorded fingerprints before uploading.', 'normal');
  }, []);

  const uploadAll = async () => {
    if (drafts.length === 0) {
      Alert.alert('No recordings', 'Nothing to upload');
      return;
    }
    setUploading(true);
    tts.speak(`Uploading ${drafts.length} fingerprints...`, 'normal');
    let ok = 0;
    for (const d of drafts) {
      const res = await recordFingerprint({
        building_id: d.building_id,
        floor: d.floor,
        x: d.x,
        y: d.y,
        label: d.label,
        readings: d.readings,
      });
      if (res) {
        ok++;
        if (d.id) {
          try {
            await deleteSurveyDraft(d.id);
          } catch {}
        }
      }
    }
    setUploading(false);
    tts.speak(`Uploaded ${ok} of ${drafts.length} fingerprints.`, 'normal');
    if (ok === 0) {
      tts.speak(
        'Upload failed. Check your connection and try again.',
        'high'
      );
    }
    if (ok > 0) {
      clearFingerprintCache(survey.buildingId || undefined);
      if (ok === drafts.length) survey.clearPointsForFloor(survey.floor);
      const trained = await trainBuilding(survey.buildingId || 'demo-mall');
      if (trained?.mode === 'on-device') {
        tts.speak('Fingerprints uploaded. On-device matching is ready.', 'normal');
      } else if (trained) {
        tts.speak('Model training triggered.', 'normal');
      }
    }
    load();
  };

  const removeDraft = async (id: number) => {
    if (uploading) return;
    const draft = drafts.find((d) => d.id === id);
    try {
      await deleteSurveyDraft(id);
    } catch {}
    if (draft) survey.removePoint(draft.x, draft.y, draft.floor);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.title}>Review Recordings</Text>
        <Text style={styles.subtitle}>
          {drafts.length} points • Floor {survey.floor}
        </Text>
      </View>
      <FlatList
        data={drafts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                ({item.x}, {item.y})
              </Text>
              <Pressable onPress={() => removeDraft(item.id)} accessible accessibilityRole="button" accessibilityLabel="Delete">
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
            <Text style={styles.cardInfo}>
              {item.readings?.length || 0} APs detected • {item.label}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No recordings yet</Text>}
      />
      <View style={styles.footer}>
        <Pressable style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]} onPress={uploadAll} disabled={uploading} accessible accessibilityRole="button" accessibilityLabel="Upload all recordings">
          <Text style={styles.uploadText}>{uploading ? 'Uploading...' : `Upload All (${drafts.length})`}</Text>
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
    marginBottom: 16,
  },
  back: {
    color: '#4a9eff',
    fontSize: 18,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 4,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  delete: {
    color: '#d93025',
    fontSize: 15,
  },
  cardInfo: {
    color: '#ccc',
    fontSize: 15,
    marginTop: 4,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  footer: {
    marginBottom: 24,
  },
  uploadBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
