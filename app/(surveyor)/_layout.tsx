import { Stack } from 'expo-router';

export default function SurveyorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="floorplan" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
