// "Nouveau mot de passe": reached from the "mot de passe oublié" e-mail link.
// On the web, supabase-js reads the tokens from the URL by itself; in the app we read them from the
// deep link (kilofly://reset-password#access_token=…&refresh_token=… or ?code=…).
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Logo, T } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

function paramsOf(url: string) {
  const out: Record<string, string> = {};
  const parts = url.split(/[?#]/).slice(1);
  for (const part of parts) for (const [k, v] of new URLSearchParams(part)) out[k] = v;
  return out;
}

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web' && url) {
        const p = paramsOf(url);
        if (p.access_token && p.refresh_token) await supabase.auth.setSession({ access_token: p.access_token, refresh_token: p.refresh_token });
        else if (p.code) await supabase.auth.exchangeCodeForSession(p.code);
      }
      // Give the web client a moment to read the link.
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return setReady('ok');
        await new Promise((r) => setTimeout(r, 300));
      }
      setReady('invalid');
    })();
  }, [url]);

  const save = async () => {
    setError(null);
    if (pw1.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (pw1 !== pw2) return setError('Les deux mots de passe ne sont pas identiques.');
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (e) return setError(e.message.includes('different') ? 'Choisissez un mot de passe différent de l’ancien.' : e.message);
    setDone(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 20, gap: 18, flex: 1 }}>
        <Logo size={26} />
        <Card gold style={{ gap: 12, marginTop: 10 }}>
          <T v="h2">Nouveau mot de passe</T>
          {ready === 'checking' ? (
            <ActivityIndicator color={colors.gold} style={{ margin: 20 }} />
          ) : ready === 'invalid' ? (
            <>
              <T v="small" color={colors.textMuted}>
                Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien depuis « Mot de passe oublié ».
              </T>
              <Button title="Retour à la connexion" small onPress={() => router.replace({ pathname: '/auth', params: { mode: 'login' } })} />
            </>
          ) : done ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <T v="bodyStrong">Mot de passe modifié !</T>
              </View>
              <T v="small" color={colors.textMuted}>
                Vous êtes connecté avec votre nouveau mot de passe.
              </T>
              <Button title="Continuer" icon="arrow-forward" onPress={() => router.replace('/(tabs)')} />
            </>
          ) : (
            <>
              <T v="small" color={colors.textMuted}>
                Choisissez un nouveau mot de passe (8 caractères minimum).
              </T>
              <View style={styles.field}>
                <TextInput
                  value={pw1}
                  onChangeText={setPw1}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  style={styles.input}
                />
                <Pressable onPress={() => setShow(!show)} hitSlop={8}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.field}>
                <TextInput
                  value={pw2}
                  onChangeText={setPw2}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  style={styles.input}
                />
              </View>
              {error && (
                <T v="small" color={colors.danger}>
                  {error}
                </T>
              )}
              {busy ? <ActivityIndicator color={colors.gold} style={{ height: 56 }} /> : <Button title="Enregistrer" icon="checkmark" onPress={save} />}
            </>
          )}
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
});
