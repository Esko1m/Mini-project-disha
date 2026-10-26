import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as SupabaseExtra;

const DEFAULT_SUPABASE_URL = 'https://lxxjwdklshldjlgcsqwr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_xAhcz4fc5FMYoeMU5NC5eQ_fy3hXTDJ';

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.supabaseUrl ||
  DEFAULT_SUPABASE_URL;
export const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  extra.supabasePublishableKey ||
  DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { 'x-application-name': 'disha-mobile' },
      },
    })
  : null;
