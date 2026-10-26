let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch (e) {
  // Native module not available (e.g., in Expo Go or before build)
  ExpoSpeechRecognitionModule = null;
  useSpeechRecognitionEvent = () => {};
}

import { useRef, useState } from 'react';

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export function useVoiceInput(onResult?: (text: string) => void) {
  const [state, setState] = useState<VoiceInputState>({ isListening: false, transcript: '', error: null });
  const lastResultRef = useRef<string>('');

  try {
    useSpeechRecognitionEvent('start', () => {
      setState((s) => ({ ...s, isListening: true, error: null }));
    });

    useSpeechRecognitionEvent('end', () => {
      setState((s) => ({ ...s, isListening: false }));
    });

    useSpeechRecognitionEvent('result', (event: any) => {
      const results = event?.results || [];
      if (results.length > 0) {
        const text = results[0]?.transcript || '';
        setState((s) => ({ ...s, transcript: text }));
        if (event?.isFinal && text && text !== lastResultRef.current) {
          lastResultRef.current = text;
          onResult?.(text.toLowerCase());
        }
      }
    });

    useSpeechRecognitionEvent('error', (event: any) => {
      setState((s) => ({ ...s, isListening: false, error: event?.message || event?.error || 'Speech error' }));
    });
  } catch {
    // ignore if events not supported
  }

  const start = async (lang = 'en-IN') => {
    if (!ExpoSpeechRecognitionModule) {
      setState((s) => ({ ...s, error: 'Speech recognition not available in this build' }));
      return;
    }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync?.();
      if (perm && perm.status !== 'granted') {
        setState((s) => ({ ...s, error: 'Microphone permission denied' }));
        return;
      }
      lastResultRef.current = '';
      setState((s) => ({ ...s, transcript: '', error: null, isListening: true }));
      ExpoSpeechRecognitionModule.start?.({ lang, interimResults: true, continuous: false });
    } catch (e: any) {
      setState((s) => ({ ...s, error: e?.message || String(e) }));
    }
  };

  const stop = () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      ExpoSpeechRecognitionModule.stop?.();
    } catch {}
    setState((s) => ({ ...s, isListening: false }));
  };

  const abort = () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      ExpoSpeechRecognitionModule.abort?.();
    } catch {}
    setState((s) => ({ ...s, isListening: false }));
  };

  return { ...state, start, stop, abort };
}

export async function ensureSpeechPermission(): Promise<boolean> {
  if (!ExpoSpeechRecognitionModule?.requestPermissionsAsync) {
    return false;
  }
  try {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return perm.status === 'granted';
  } catch {
    return false;
  }
}
