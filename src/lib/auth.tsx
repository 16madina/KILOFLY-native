import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { unregisterPush } from '@/lib/push';
import { authErrorMessage, supabase, type Profile } from '@/lib/supabase';

type SignUpInput = { email: string; password: string; fullName: string; userType: string };
type Result = { error?: string; needsConfirmation?: boolean };

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  /** Has the 'admin' role (checked by the server). */
  isAdmin: boolean;
  loading: boolean;
  /** Browsing without an account ("Passer"). */
  guest: boolean;
  setGuest: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (input: SignUpInput) => Promise<Result>;
  /** "Continuer avec Google / Apple". */
  signInWithProvider: (provider: 'google' | 'apple') => Promise<Result & { cancelled?: boolean }>;
  resetPassword: (email: string) => Promise<Result>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Sends a 6-digit code to the account e-mail. */
  sendEmailCode: () => Promise<Result>;
  /** Checks the code and marks the e-mail as verified on the profile. */
  confirmEmailCode: (code: string) => Promise<Result>;
  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'country' | 'bio' | 'avatar_url' | 'user_type'>>) => Promise<Result>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    // A banned account is signed out right away.
    const { data: banned } = await supabase.rpc('my_ban_status');
    if (banned === true) {
      await supabase.auth.signOut();
      return;
    }
    const { data: admin } = await supabase.rpc('is_admin');
    setIsAdmin(admin === true);
    const { data } = await supabase.rpc('get_my_profile');
    setProfile(((data as Profile[] | null) ?? [])[0] ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Opened from the "mot de passe oublié" e-mail: ask for the new password.
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => router.replace('/reset-password'), 0);
      // Don't await inside the callback (supabase-js recommendation).
      setTimeout(() => loadProfile(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      isAdmin,
      loading,
      guest,
      setGuest,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return { error: authErrorMessage(error.message) };
        const { data: banned } = await supabase.rpc('my_ban_status');
        if (banned === true) {
          await supabase.auth.signOut();
          return { error: 'Ce compte a été suspendu. Contactez le support KiloFly.' };
        }
        return {};
      },
      async signInWithProvider(provider) {
        try {
          // iPhone: Apple's own sign-in sheet (required by the App Store).
          if (provider === 'apple' && Platform.OS === 'ios') {
            const cred = await AppleAuthentication.signInAsync({
              requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
            });
            if (!cred.identityToken) return { error: 'Connexion Apple impossible.' };
            const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
            if (error) return { error: authErrorMessage(error.message) };
            const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
            if (name) await supabase.rpc('set_my_name_if_missing', { p_name: name });
          } else if (Platform.OS === 'web') {
            const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: { redirectTo: `${window.location.origin}/` },
            });
            return error ? { error: authErrorMessage(error.message) } : {};
          } else {
            // Android (and Google on iPhone): secure browser window, then back to the app.
            const redirectTo = Linking.createURL('auth-callback');
            const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
            if (error || !data.url) return { error: error ? authErrorMessage(error.message) : 'Connexion impossible.' };
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
            if (res.type !== 'success') return { cancelled: true };
            const params: Record<string, string> = {};
            for (const part of res.url.split(/[?#]/).slice(1)) for (const [k, v] of new URLSearchParams(part)) params[k] = v;
            if (params.error_description) return { error: params.error_description };
            const r = params.code
              ? await supabase.auth.exchangeCodeForSession(params.code)
              : await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
            if (r.error) return { error: authErrorMessage(r.error.message) };
          }
        } catch (e: any) {
          if (e?.code === 'ERR_REQUEST_CANCELED') return { cancelled: true };
          return { error: e?.message ?? 'Connexion impossible.' };
        }
        const { data: banned } = await supabase.rpc('my_ban_status');
        if (banned === true) {
          await supabase.auth.signOut();
          return { error: 'Ce compte a été suspendu. Contactez le support KiloFly.' };
        }
        return {};
      },
      async signUp({ email, password, fullName, userType }) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), user_type: userType, terms_accepted: true },
          },
        });
        if (error) return { error: authErrorMessage(error.message) };
        // No session = the project requires e-mail confirmation first.
        return { needsConfirmation: !data.session };
      },
      async resetPassword(email) {
        // The e-mail link comes back to the app (or the website) on the "new password" screen.
        const redirectTo =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : Linking.createURL('reset-password');
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        return error ? { error: authErrorMessage(error.message) } : {};
      },
      async signOut() {
        await unregisterPush();
        await supabase.auth.signOut();
        setGuest(false);
      },
      async sendEmailCode() {
        const email = session?.user.email;
        if (!email) return { error: 'Non connecté.' };
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        return error ? { error: authErrorMessage(error.message) } : {};
      },
      async confirmEmailCode(code) {
        const email = session?.user.email;
        if (!email) return { error: 'Non connecté.' };
        const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
        if (error) return { error: authErrorMessage(error.message) };
        const { error: e2 } = await supabase.rpc('mark_email_verified');
        if (e2) return { error: e2.message };
        const { data } = await supabase.auth.getSession();
        await loadProfile(data.session);
        return {};
      },
      async refreshProfile() {
        await loadProfile(session);
      },
      async updateProfile(patch) {
        if (!session) return { error: 'Non connecté.' };
        const { error } = await supabase
          .from('profiles')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', session.user.id);
        if (error) return { error: error.message };
        await loadProfile(session);
        return {};
      },
    }),
    [session, profile, isAdmin, loading, guest, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const initialsOf = (name?: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';
