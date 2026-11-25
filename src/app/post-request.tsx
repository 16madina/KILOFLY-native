import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityField, DateStrip, Segmented, Stepper } from '@/components/listing-bits';
import { Button, IconButton, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createRequest, currencySymbol, toIsoDay, type Currency } from '@/lib/listings';
import { colors, fonts, radius } from '@/theme';

/** "J'envoie un colis": a shipping request travelers can answer. */
export default function PostRequest() {
  const insets = useSafeAreaInsets();
  const { loading: authLoading, session } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [kg, setKg] = useState(5);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href="/auth" />;

  const submit = async () => {
    setError(null);
    if (from.trim().length < 2 || to.trim().length < 2) return setError('Indiquez la ville de départ et la ville d’arrivée.');
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return setError('Le départ et l’arrivée doivent être différents.');
    if (!dateStart) return setError('Choisissez à partir de quand le colis peut partir.');
    if (description.trim().length < 3) return setError('Décrivez brièvement le contenu du colis.');
    const budgetNum = budget ? Number(budget.replace(',', '.')) : null;
    if (budget && !(budgetNum! > 0)) return setError('Budget invalide.');

    setBusy(true);
    const r = await createRequest(session.user.id, {
      from,
      to,
      dateStart,
      dateEnd,
      kg,
      budgetMax: budgetNum,
      currency,
      description,
    });
    setBusy(false);
    if (r.error) return setError(r.error);
    router.replace({ pathname: '/(tabs)/post', params: { created: 'request' } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/post'))} />
        <T v="h2">Envoyer un colis</T>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 18 }}>
        <T v="body" color={colors.textMuted}>
          Publiez votre demande : les voyageurs qui font ce trajet pourront vous proposer leurs kilos.
        </T>

        <CityField label="Le colis part de" value={from} onChange={setFrom} placeholder="Ex. Paris" />
        <CityField label="Il doit arriver à" value={to} onChange={setTo} placeholder="Ex. Conakry" icon="flag-outline" />

        <DateStrip label="Le colis peut partir à partir du" value={dateStart} onChange={(d) => (setDateStart(d), d && dateEnd && dateEnd < d && setDateEnd(null))} />
        <DateStrip
          label="Et au plus tard le (facultatif)"
          value={dateEnd}
          onChange={setDateEnd}
          minDate={dateStart ?? toIsoDay(new Date())}
          days={21}
          allowEmpty
        />

        <T v="title">Poids du colis</T>
        <Stepper value={kg} onChange={setKg} min={1} max={46} suffix="kilos" />

        <T v="title">Contenu</T>
        <TextInput
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Ex. vêtements pour enfants, 2 paires de chaussures…"
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocus('desc')}
          onBlur={() => setFocus(null)}
          style={[styles.textarea, focus === 'desc' && { borderColor: colors.gold }]}
          maxLength={300}
        />

        <T v="title">Budget maximum (facultatif)</T>
        <Segmented
          options={[
            ['EUR', 'Euro €'],
            ['USD', 'Dollar $'],
            ['XOF', 'FCFA'],
          ]}
          value={currency}
          onChange={setCurrency}
        />
        <View style={[styles.priceBox, focus === 'budget' && { borderColor: colors.gold }]}>
          <TextInput
            value={budget}
            onChangeText={(v) => setBudget(v.replace(/[^0-9.,]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={colors.textFaint}
            onFocus={() => setFocus('budget')}
            onBlur={() => setFocus(null)}
            style={styles.priceInput}
          />
          <T v="h2" color={colors.textMuted}>
            {currencySymbol(currency)} au total
          </T>
        </View>

        {error && (
          <T v="small" color={colors.danger}>
            {error}
          </T>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? <ActivityIndicator color={colors.gold} style={{ height: 56 }} /> : <Button title="Publier ma demande" icon="arrow-forward" onPress={submit} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  textarea: {
    minHeight: 90,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  priceInput: { flex: 1, fontFamily: fonts.serif, fontSize: 28, color: colors.text, minWidth: 0 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(3,15,30,0.94)' },
});
