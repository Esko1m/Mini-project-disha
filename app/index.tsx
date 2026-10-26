import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getAppState } from '../lib/storage/localDb';

export default function Index() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getAppState('onboarding_complete')
      .then((value) => {
        if (active) setOnboarded(value === '1');
      })
      .catch(() => {
        if (active) setOnboarded(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (onboarded === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#4a9eff" />
      </View>
    );
  }

  return (
    <Redirect
      href={onboarded ? '/(navigation)' : '/(onboarding)/welcome'}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
