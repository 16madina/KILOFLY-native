import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, notify } from '@/components/admin-ui';
import { BackButton, BrandHeader, Button, Card, Chip, T, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Prefs = {
  push_enabled: boolean;
  messages_enabled: boolean;
  responses_enabled: boolean;
  alerts_enabled: boolean;
  promotions_enabled: boolean;
};

const DEFAULT_PREFS: Prefs = {
  push_enabled: true,
  messages_enabled: true,
  responses_enabled: true,
  alerts_enabled: true,
  promotions_enabled: false,
};

const prefRows: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: 'push_enabled', label: 'Notifications sur le téléphone', sub: 'Recevoir les alertes même app fermée' },
  { key: 'messages_enabled', label: 'Messages', sub: 'Nouveaux messages des voyageurs et expéditeurs' },
  { key: 'responses_enabled', label: 'Réservations et offres', sub: 'Demandes, réponses, paiements, livraisons' },
  { key: 'alerts_enabled', label: 'Alertes de trajet', sub: 'Nouveaux voyages sur vos trajets suivis' },
  { key: 'promotions_enabled', label: 'Offres KiloFly', sub: 'Nouveautés et promotions (rarement)' },
];

const currencies: [string, string][] = [
  ['EUR', 'Euro €'],
  ['XOF', 'Franc CFA'],
  ['CAD', 'Dollar CA'],
  ['USD', 'Dollar US'],
];

export const SUPPORT_EMAIL = 'kiloflyapp@hotmail.com';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
      return;
    }
    supabase
      .from('notification_preferences')
      .select('push_enabled, messages_enabled, responses_enabled, alerts_enabled, promotions_enabled')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPrefs((data as Prefs | null) ?? DEFAULT_PREFS));
  }, [session]);

  if (!session) return null;

  async function setPref(key: keyof Prefs, value: boolean) {
    const next = { ...(prefs ?? DEFAULT_PREFS), [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: session!.user.id, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) notify("Impossible d'enregistrer : " + error.message);
  }

  async function setCurrency(code: string) {
    const { error } = await supabase.from('profiles').update({ preferred_currency: code }).eq('id', session!.user.id);
    if (error) notify(error.message);
    else refreshProfile();
  }

  async function changePassword() {
    if (pw1.length < 8) return notify('Le mot de passe doit contenir au moins 8 caractères.');
    if (pw1 !== pw2) return notify('Les deux mots de passe ne sont pas identiques.');
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwBusy(false);
    if (error) return notify(error.message);
    setPw1('');
    setPw2('');
    notify('Mot de passe modifié.');
  }

  async function deleteAccount() {
    const ok = await confirm(
      'Supprimer mon compte ?',
      'Votre profil, vos annonces et vos données seront supprimés définitivement. Les réservations en cours doivent être terminées ou annulées avant. Cette action est irréversible.',
    );
    if (!ok) return;
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return notify(error.message.includes('active reservations') ? 'Vous avez encore des réservations en cours. Terminez-les ou annulez-les avant de supprimer votre compte.' : error.message);
    await signOut();
    router.replace('/welcome');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title">Préférences</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 12 }}>
        <Section title="Notifications" />
        <Card style={{ paddingVertical: 4 }}>
          {!prefs ? (
            <ActivityIndicator color={colors.gold} style={{ margin: 20 }} />
          ) : (
            prefRows.map((r, i) => (
              <View key={r.key} style={[styles.row, i > 0 && styles.sep]}>
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong">{r.label}</T>
                  <T v="caption" color={colors.textMuted}>
                    {r.sub}
                  </T>
                </View>
                <Switch
                  value={prefs[r.key]}
                  onValueChange={(v) => setPref(r.key, v)}
                  trackColor={{ true: colors.gold, false: colors.cardHi }}
                  thumbColor={colors.text}
                  disabled={r.key !== 'push_enabled' && !prefs.push_enabled}
                />
              </View>
            ))
          )}
        </Card>

        <Section title="Devise préférée" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {currencies.map(([code, label]) => (
            <Chip key={code} label={label} active={(profile?.preferred_currency ?? 'EUR') === code} onPress={() => setCurrency(code)} />
          ))}
        </View>

        <Section title="Sécurité" />
        <Card style={{ gap: 10 }}>
          <T v="bodyStrong">Changer mon mot de passe</T>
          <PwField value={pw1} onChange={setPw1} placeholder="Nouveau mot de passe" />
          <PwField value={pw2} onChange={setPw2} placeholder="Confirmer le mot de passe" />
          {pwBusy ? <ActivityIndicator color={colors.gold} /> : <Button title="Enregistrer" small onPress={changePassword} />}
        </Card>

        <Section title="Aide et informations" />
        <Card style={{ paddingVertical: 4 }}>
          <LinkRow icon="help-circle-outline" label="Questions fréquentes" onPress={() => router.push('/info/faq')} first />
          <LinkRow icon="ban-outline" label="Objets interdits" onPress={() => router.push('/info/prohibited')} />
          <LinkRow icon="airplane-outline" label="Règles des aéroports" onPress={() => router.push('/info/airports')} />
          <LinkRow icon="document-text-outline" label="Conditions d'utilisation" onPress={() => router.push('/info/terms')} />
          <LinkRow icon="lock-closed-outline" label="Politique de confidentialité" onPress={() => router.push('/info/privacy')} />
          <LinkRow icon="mail-outline" label="Contacter le support" sub={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        </Card>

        <Section title="Compte" />
        <Card style={{ paddingVertical: 4 }}>
          <LinkRow icon="log-out-outline" label="Se déconnecter" onPress={async () => (await signOut(), router.replace('/(tabs)'))} first />
          <LinkRow icon="trash-outline" label="Supprimer mon compte" danger onPress={deleteAccount} />
        </Card>
      </View>
    </ScrollView>
  );
}

function Section({ title }: { title: string }) {
  return (
    <T v="label" color={colors.gold} style={{ marginTop: 10 }}>
      {title}
    </T>
  );
}

function PwField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      secureTextEntry
      autoCapitalize="none"
      textContentType="newPassword"
      style={styles.input}
    />
  );
}

function LinkRow({ icon, label, sub, onPress, first, danger }: { icon: IconName; label: string; sub?: string; onPress: () => void; first?: boolean; danger?: boolean }) {
  const c = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !first && styles.sep, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.gold} />
      <View style={{ flex: 1 }}>
        <T v="body" color={c}>
          {label}
        </T>
        {sub && (
          <T v="caption" color={colors.textMuted}>
            {sub}
          </T>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
