import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSurveyStore } from '../../store/surveyStore';
import { useBuildingStore } from '../../store/buildingStore';
import { getBuildings } from '../../lib/api/buildings';
import { tts } from '../../lib/speech/tts';

const fallbackBuildings = [
  { id: 'demo-mall', name: 'City Mall', address: 'MG Road', city: 'Bengaluru' },
  { id: 'demo-hospital', name: 'NIMHANS Convention Centre', address: 'Hosur Road', city: 'Bengaluru' },
];

export default function SurveyorHomeScreen() {
  const router = useRouter();
  const survey = useSurveyStore();
  const building = useBuildingStore();
  const initialBuilding = building.selectedBuilding || building.buildings[0];
  const [buildingId, setBuildingId] = useState(initialBuilding?.id || 'demo-mall');
  const [floor, setFloor] = useState(1);
  const [showPicker, setShowPicker] = useState(false);

  const buildings = building.buildings.length > 0 ? building.buildings : fallbackBuildings;
  const selectedBuilding =
    buildings.find((b) => b.id === buildingId) || buildings[0] || initialBuilding;

  useEffect(() => {
    let active = true;
    survey.setBuilding(buildingId);
    survey.setFloor(floor);
    tts.speak('Surveyor mode. Select building and floor, then start survey.', 'normal');

    const loadBuildings = async () => {
      if (useBuildingStore.getState().buildings.length > 0) return;
      const remote = await getBuildings();
      if (active && remote.length > 0) {
        useBuildingStore.getState().setBuildings(remote);
        const current = useSurveyStore.getState().buildingId;
        if (!remote.some((b) => b.id === current)) {
          const fallback = remote[0].id;
          useSurveyStore.getState().setBuilding(fallback);
          setBuildingId(fallback);
        }
      }
    };

    loadBuildings();
    return () => {
      active = false;
    };
  }, []);

  const chooseBuilding = (id: string) => {
    setBuildingId(id);
    survey.setBuilding(id);
    setShowPicker(false);
  };

  const startSurvey = () => {
    survey.setBuilding(buildingId);
    survey.setFloor(floor);
    survey.startSurvey();
    tts.speak(`Starting survey for floor ${floor}. Tap grid points to record fingerprints.`, 'normal');
    router.push('/(surveyor)/floorplan');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(navigation)/settings')} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Surveyor Mode</Text>
        <Text style={styles.subtitle}>Collect WiFi fingerprints for building mapping</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Building</Text>
        <Pressable
          style={styles.select}
          onPress={() => setShowPicker(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Select building. Current building ${selectedBuilding?.name || buildingId}`}
        >
          <Text style={styles.selectText}>
            {selectedBuilding?.name || 'City Mall'} ({buildingId})
          </Text>
        </Pressable>
        <Text style={styles.label}>Floor</Text>
        <View style={styles.floorRow}>
          {[1, 2, 3].map((f) => (
            <Pressable
              key={f}
              style={[styles.floorBtn, floor === f && styles.floorBtnActive]}
              onPress={() => {
                setFloor(f);
                survey.setFloor(f);
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Floor ${f}`}
            >
              <Text style={[styles.floorText, floor === f && styles.floorTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={startSurvey} accessible accessibilityRole="button" accessibilityLabel="Start new survey">
          <Text style={styles.primaryText}>Start New Survey</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(surveyor)/review')} accessible accessibilityRole="button" accessibilityLabel="View recordings">
          <Text style={styles.secondaryText}>View Recordings</Text>
        </Pressable>
      </View>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Building</Text>
            <ScrollView style={styles.modalList}>
              {buildings.map((b) => (
                <Pressable
                  key={b.id}
                  style={[styles.modalOption, b.id === buildingId && styles.modalOptionActive]}
                  onPress={() => chooseBuilding(b.id)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${b.name}`}
                >
                  <Text style={styles.modalOptionText}>{b.name}</Text>
                  <Text style={styles.modalOptionSubtext}>
                    {b.address || b.city ? `${b.address || ''}${b.address && b.city ? ', ' : ''}${b.city || ''}` : b.id}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCancel} onPress={() => setShowPicker(false)} accessible accessibilityRole="button" accessibilityLabel="Cancel building selection">
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 12,
  },
  label: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  select: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  selectText: {
    color: '#fff',
    fontSize: 16,
  },
  floorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  floorBtn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  floorBtnActive: {
    backgroundColor: '#1a73e8',
  },
  floorText: {
    color: '#ccc',
    fontSize: 18,
    fontWeight: '600',
  },
  floorTextActive: {
    color: '#fff',
  },
  actions: {
    marginTop: 32,
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
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 360,
  },
  modalOption: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  modalOptionActive: {
    backgroundColor: '#1a73e8',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalOptionSubtext: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 4,
  },
  modalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelText: {
    color: '#aaa',
    fontSize: 16,
  },
});
