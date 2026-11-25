import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(url, key, {
  auth: {
    // On web the default (localStorage) is used; AsyncStorage on iOS/Android.
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Refresh the session only while the app is in the foreground (recommended for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  user_type: 'traveler' | 'shipper' | 'professional' | string;
  created_at: string;
  id_verified: boolean;
  phone_verified: boolean;
  completed_trips: number;
  response_rate: number;
  preferred_currency: string | null;
};

/** French message for common Supabase auth errors. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return 'Confirmez d’abord votre adresse e-mail (lien reçu par e-mail).';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (m.includes('password should be at least') || m.includes('weak password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('unable to validate email') || m.includes('invalid email') || m.includes('email address') && m.includes('invalid'))
    return 'Adresse e-mail invalide.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (m.includes('network') || m.includes('fetch')) return 'Pas de connexion internet.';
  return message;
}
