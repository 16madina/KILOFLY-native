import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, Button, IconButton, Logo, T, tap, type IconName } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

export default function Auth() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Logo size={26} />
          <IconButton icon="close" onPress={() => router.back()} />
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
            <Pressable key={m} onPress={() => (tap(), setMode(m))} style={[styles.segItem, mode === m && styles.segActive]}>
              <T v="small" color={mode === m ? colors.text : colors.textMuted} style={{ fontFamily: fonts.semibold }}>
                {m === 'signup' ? 'Inscription' : 'Connexion'}
              </T>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12, marginTop: 20 }}>
          {mode === 'signup' && <Input icon="person-outline" placeholder="Nom complet" />}
          <Input icon="mail-outline" placeholder="Adresse e-mail" keyboard="email-address" />
          <Input icon="lock-closed-outline" placeholder="Mot de passe" secure />
        </View>

        {mode === 'login' && (
          <T v="small" color={colors.gold} style={{ alignSelf: 'flex-end', marginTop: 12 }}>
            Mot de passe oublié ?
          </T>
        )}

        <Button
          title={mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          icon="arrow-forward"
          style={{ marginTop: 24 }}
          onPress={() => router.replace('/(tabs)')}
        />

        <View style={styles.or}>
          <View style={styles.orLine} />
          <T v="caption" color={colors.textFaint}>
            ou continuer avec
          </T>
          <View style={styles.orLine} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Social icon="logo-apple" label="Apple" />
          <Social icon="logo-google" label="Google" />
        </View>

        <T v="caption" color={colors.textFaint} style={{ textAlign: 'center', marginTop: 28 }}>
          En continuant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.
        </T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ icon, placeholder, secure, keyboard }: { icon: IconName; placeholder: string; secure?: boolean; keyboard?: 'email-address' }) {
  return (
    <View style={styles.input}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize="none"
        style={styles.inputText}
      />
    </View>
  );
}

function Social({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Pressable style={styles.social}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <T v="bodyStrong">{label}</T>
    </Pressable>
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
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  social: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
});
