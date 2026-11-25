import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/theme';

/** Profile card: send a 6-digit code to the account e-mail, then enter it to verify. */
export function EmailVerifyCard() {
  const { session, sendEmailCode, confirmEmailCode } = useAuth();
  const [step, setStep] = useState<'idle' | 'code'>('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const send = async () => {
    setError(null);
    setBusy(true);
    const r = await sendEmailCode();
    setBusy(false);
    if (r.error) return setError(r.error);
    setStep('code');
  };

  const confirm = async () => {
    setError(null);
    if (code.trim().length < 6) return setError('Saisissez les 6 chiffres du code.');
    setBusy(true);
    const r = await confirmEmailCode(code);
    setBusy(false);
    if (r.error) return setError(r.error);
  };

  return (
    <Card gold style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.icon}>
          <Ionicons name="mail-unread-outline" size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">Vérifiez votre e-mail</T>
          <T v="small" color={colors.textMuted}>
            {step === 'idle'
              ? 'Un profil vérifié inspire confiance aux voyageurs et aux expéditeurs.'
              : `Code envoyé à ${session?.user.email}. Pensez à regarder vos spams.`}
          </T>
        </View>
      </View>

      {step === 'code' && (
        <View style={[styles.codeBox, focused && { borderColor: colors.gold }]}>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={confirm}
            style={styles.codeInput}
          />
        </View>
      )}

      {error && (
        <T v="small" color={colors.danger}>
          {error}
        </T>
      )}

      {busy ? (
        <ActivityIndicator color={colors.gold} style={{ height: 44 }} />
      ) : step === 'idle' ? (
        <Button title="Recevoir un code" small icon="arrow-forward" onPress={send} />
      ) : (
        <View style={{ gap: 8 }}>
          <Button title="Valider le code" small icon="checkmark" onPress={confirm} />
          <Button title="Renvoyer un code" small variant="dark" onPress={send} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
    justifyContent: 'center',
  },
  codeInput: {
    fontFamily: fonts.semibold,
    fontSize: 26,
    letterSpacing: 12,
    textAlign: 'center',
    color: colors.goldBright,
  },
});
