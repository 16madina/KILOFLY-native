import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authErrorMessage, supabase, type Profile } from '@/lib/supabase';

type SignUpInput = { email: string; password: string; fullName: string; userType: string };
type Result = { error?: string; needsConfirmation?: boolean };

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Browsing without an account ("Passer"). */
  guest: boolean;
  setGuest: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (input: SignUpInput) => Promise<Result>;
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
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.rpc('get_my_profile');
    setProfile(((data as Profile[] | null) ?? [])[0] ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Don't await inside the callback (supabase-js recommendation).
      setTimeout(() => loadProfile(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      guest,
      setGuest,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? { error: authErrorMessage(error.message) } : {};
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
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        return error ? { error: authErrorMessage(error.message) } : {};
      },
      async signOut() {
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
    [session, profile, loading, guest, loadProfile],
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
