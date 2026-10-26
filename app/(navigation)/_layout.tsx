import { Stack } from 'expo-router';

export default function NavigationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="buildings" />
      <Stack.Screen name="destination" />
      <Stack.Screen name="navigate" />
      <Stack.Screen name="arrived" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
