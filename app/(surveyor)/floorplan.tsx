import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSurveyStore } from '../../store/surveyStore';
import { scanWifiWithTimeout } from '../../lib/wifi/scanner';
import { deleteSurveyDraft, getSurveyDrafts, saveSurveyDraft } from '../../lib/storage/localDb';
import { tts } from '../../lib/speech/tts';

export default function FloorPlanViewScreen() {
  const router = useRouter();
  const survey = useSurveyStore();
  const [gridPoints] = useState(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: (i % 4) * 20,
      y: Math.floor(i / 4) * 20,
      recorded: false,
    }))
  );
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    tts.speak('Tap grid points to record WiFi fingerprints. Walk around and cover the floor.', 'normal');

    let active = true;
    (async () => {
      try {
        const state = useSurveyStore.getState();
        const drafts = await getSurveyDrafts(
          state.buildingId || 'demo-mall',
          state.floor
        );
        if (!active) return;

        const chronological = [...drafts].reverse();
        const existing = new Set(
          state.points.map((p) => `${p.x},${p.y},${p.floor}`)
        );
        for (const draft of chronological) {
          const key = `${draft.x},${draft.y},${draft.floor}`;
          if (!existing.has(key)) {
            state.addPoint({
              x: draft.x,
              y: draft.y,
              floor: draft.floor,
              label: draft.label,
              readings: draft.readings,
            });
            existing.add(key);
          }
        }
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, []);

  const recordPoint = async (gp: any) => {
    if (scanning) return;
    setScanning(true);
    const buildingId = survey.buildingId || 'demo-mall';
    tts.speak('Scanning WiFi...', 'normal');
    const scan = await scanWifiWithTimeout();
    setScanning(false);
    if (scan.length === 0) {
      tts.speak('No WiFi networks found. Move to a different location and try again.', 'normal');
      return;
    }
    const reading = {
      building_id: buildingId,
      floor: survey.floor,
      x: gp.x,
      y: gp.y,
      label: `Point ${gp.x},${gp.y}`,
      readings: scan,
      surveyed_at: new Date().toISOString(),
    };
    try {
      await saveSurveyDraft(reading);
      survey.addPoint({ x: gp.x, y: gp.y, floor: survey.floor, label: reading.label, readings: scan });
      tts.speak(`Recorded ${scan.length} access points at point ${gp.x}, ${gp.y}.`, 'normal');
    } catch {
      tts.speak('Could not save this reading. Please try again.', 'normal');
    }
  };

  const undoLast = async () => {
    if (scanning) return;
    if (survey.points.length === 0) {
      tts.speak('There are no recordings to undo.', 'normal');
      return;
    }

    try {
      const drafts = await getSurveyDrafts(
        survey.buildingId || 'demo-mall',
        survey.floor
      );
      const last = drafts[0];
      if (!last) {
        tts.speak('There are no saved recordings to undo.', 'normal');
        return;
      }
      await deleteSurveyDraft(last.id);
      survey.removePoint(last.x, last.y, last.floor);
      tts.speak('Last point removed.', 'normal');
    } catch {
      tts.speak('Could not remove the last point. Please try again.', 'normal');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.title}>Floor Plan Survey</Text>
        <Text style={styles.subtitle}>
          Building: {survey.buildingId} • Floor: {survey.floor} • Recorded: {survey.points.length}
        </Text>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {gridPoints.map((gp) => {
            const recorded = survey.points.some((p) => p.x === gp.x && p.y === gp.y);
            return (
              <Pressable
                key={gp.id}
                style={[styles.gridPoint, recorded && styles.gridPointRecorded]}
                onPress={() => recordPoint(gp)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Grid point at ${gp.x}, ${gp.y}. ${recorded ? 'Recorded' : 'Tap to record'}`}
              >
                <Text style={styles.gridPointText}>{recorded ? '\u2713' : '+'}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.status}>{scanning ? 'Scanning WiFi...' : 'Tap points to record fingerprints'}</Text>
        <View style={styles.footerBtns}>
          <Pressable style={styles.btn} onPress={undoLast} accessible accessibilityRole="button" accessibilityLabel="Undo last">
            <Text style={styles.btnText}>Undo</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => router.push('/(surveyor)/review')} accessible accessibilityRole="button" accessibilityLabel="Review recordings">
            <Text style={styles.btnText}>Review</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.primaryBtn]} onPress={() => router.push('/(surveyor)/review')} accessible accessibilityRole="button" accessibilityLabel="Upload batch">
            <Text style={[styles.btnText, styles.primaryBtnText]}>Upload</Text>
          </Pressable>
        </View>
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
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
  },
  gridPoint: {
    width: 60,
    height: 60,
    margin: 5,
    backgroundColor: '#333',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPointRecorded: {
    backgroundColor: '#2e7d32',
  },
  gridPointText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginBottom: 24,
  },
  status: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 16,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#1a73e8',
  },
  primaryBtnText: {
    fontWeight: '700',
  },
});
