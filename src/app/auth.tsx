import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, Button, IconButton, Logo, T, tap, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/theme';

const typeLabels: Record<string, string> = {
  traveler: 'Je voyage',
  shipper: 'J’envoie des colis',
  professional: 'Transporteur / transitaire',
};

export default function Auth() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: 'login' | 'signup'; type?: string }>();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(params.mode ?? 'signup');
  const [userType, setUserType] = useState(params.type ?? 'traveler');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (m: 'login' | 'signup') => {
    tap();
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) return setError('Renseignez votre e-mail et votre mot de passe.');
    if (mode === 'signup' && fullName.trim().length < 2) return setError('Renseignez votre nom complet.');
    if (mode === 'signup' && password.length < 6) return setError('Mot de passe trop court (6 caractères minimum).');

    setBusy(true);
    if (mode === 'login') {
      const r = await signIn(email, password);
      setBusy(false);
      if (r.error) return setError(r.error);
      router.replace('/(tabs)');
    } else {
      const r = await signUp({ email, password, fullName, userType });
      setBusy(false);
      if (r.error) return setError(r.error);
      if (r.needsConfirmation) {
        setMode('login');
        setPassword('');
        return setInfo(`Compte créé ! Un e-mail de confirmation a été envoyé à ${email.trim()}. Cliquez sur le lien, puis connectez-vous.`);
      }
      // New account: land on the profile page.
      router.replace('/(tabs)/profile');
    }
  };

  const forgot = async () => {
    setError(null);
    if (!email.trim()) return setError('Saisissez d’abord votre e-mail ci-dessus.');
    setBusy(true);
    const r = await resetPassword(email);
    setBusy(false);
    if (r.error) return setError(r.error);
    setInfo(`Si un compte existe pour ${email.trim()}, un lien de réinitialisation vient d’être envoyé.`);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Logo size={26} />
          <IconButton icon="close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        </View>

        <AccentTitle
          before={mode === 'signup' ? 'Bienvenue ' : 'Bon '}
          accent={mode === 'signup' ? 'à bord' : 'retour'}
          style={{ marginTop: 36 }}
        />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6 }}>
          {mode === 'signup' ? 'Créez votre compte en moins d’une minute.' : 'Connectez-vous pour retrouver vos colis.'}
        </T>

        <View style={styles.segment}>
          {(['signup', 'login'] as const).map((m) => (
            <Pressable key={m} onPress={() => switchMode(m)} style={[styles.segItem, mode === m && styles.segActive]}>
              <T v="small" color={mode === m ? colors.text : colors.textMuted} style={{ fontFamily: fonts.semibold }}>
                {m === 'signup' ? 'Inscription' : 'Connexion'}
              </T>
            </Pressable>
          ))}
        </View>

        {mode === 'signup' && (
          <View style={{ marginTop: 18 }}>
            <T v="caption" color={colors.textMuted} style={{ marginBottom: 8 }}>
              Je souhaite…
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(typeLabels).map(([k, label]) => (
                <Pressable key={k} onPress={() => (tap(), setUserType(k))} style={[styles.type, userType === k && styles.typeActive]}>
                  <T v="caption" color={userType === k ? colors.goldBright : colors.text}>
                    {label}
                  </T>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: 12, marginTop: 18 }}>
          {mode === 'signup' && (
            <Input icon="person-outline" placeholder="Nom complet" value={fullName} onChange={setFullName} autoCapitalize="words" />
          )}
          <Input icon="mail-outline" placeholder="Adresse e-mail" value={email} onChange={setEmail} keyboard="email-address" />
          <Input
            icon="lock-closed-outline"
            placeholder="Mot de passe"
            value={password}
            onChange={setPassword}
            secure={!showPassword}
            right={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            }
            onSubmit={submit}
          />
        </View>

        {mode === 'login' && (
          <Pressable onPress={forgot} style={{ alignSelf: 'flex-end', marginTop: 12 }} hitSlop={8}>
            <T v="small" color={colors.gold}>
              Mot de passe oublié ?
            </T>
          </Pressable>
        )}

        {error && (
          <View style={[styles.notice, styles.noticeError]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <T v="small" style={{ flex: 1 }}>
              {error}
            </T>
          </View>
        )}
        {info && (
          <View style={[styles.notice, styles.noticeInfo]}>
            <Ionicons name="mail-outline" size={18} color={colors.success} />
            <T v="small" style={{ flex: 1 }}>
              {info}
            </T>
          </View>
        )}

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : (
          <Button title={mode === 'signup' ? 'Créer mon compte' : 'Se connecter'} icon="arrow-forward" style={{ marginTop: 22 }} onPress={submit} />
        )}

        <T v="caption" color={colors.textFaint} style={{ textAlign: 'center', marginTop: 28 }}>
          En continuant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.
        </T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  icon,
  placeholder,
  value,
  onChange,
  secure,
  keyboard,
  autoCapitalize = 'none',
  right,
  onSubmit,
}: {
  icon: IconName;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboard?: 'email-address';
  autoCapitalize?: 'none' | 'words';
  right?: React.ReactNode;
  onSubmit?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.input, focused && { borderColor: colors.gold }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.inputText}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginTop: 24,
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  segItem: { flex: 1, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.borderGold },
  type: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
  typeActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  inputText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, minWidth: 0 },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, marginTop: 16 },
  noticeError: { borderColor: 'rgba(229,103,95,0.4)', backgroundColor: colors.dangerSoft },
  noticeInfo: { borderColor: 'rgba(61,190,122,0.35)', backgroundColor: colors.successSoft },
  busy: { height: 56, marginTop: 22, alignItems: 'center', justifyContent: 'center' },
});
