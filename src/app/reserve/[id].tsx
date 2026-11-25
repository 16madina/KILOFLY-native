import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading, Stepper } from '@/components/listing-bits';
import { Button, Card, Divider, FlightProgress, IconButton, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cityCode } from '@/lib/cities';
import { longDate, money, useListing } from '@/lib/listings';
import { createReservation } from '@/lib/reservations';
import { colors, fonts, radius } from '@/theme';

const fee = (base: number, currency: string) => (currency === 'XOF' ? Math.round(base * 0.05) : Math.round(base * 5) / 100);

export default function Reserve() {
  const { id, kg: kgParam } = useLocalSearchParams<{ id: string; kg?: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const { data: l, loading } = useListing(id);
  const [kg, setKg] = useState(Number(kgParam) || 1);
  const [item, setItem] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href={{ pathname: '/auth', params: { mode: 'login' } }} />;
  if (loading && !l) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  }
  if (!l || l.status !== 'active' || l.remainingKg <= 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16, paddingHorizontal: 16, gap: 16 }}>
        <IconButton icon="close" onPress={() => router.back()} />
        <EmptyState icon="airplane-outline" title="Trajet indisponible" text="Ce trajet est complet ou n’est plus disponible." />
      </View>
    );
  }

  const safeKg = Math.min(Math.max(kg, 1), l.remainingKg);
  const base = Math.round(safeKg * l.pricePerKg * 100) / 100;
  const serviceFee = fee(base, l.currency);

  const submit = async () => {
    setError(null);
    if (item.trim().length < 3) return setError('Décrivez le contenu du colis (ex. vêtements, documents…).');
    setBusy(true);
    const r = await createReservation({ listingId: l.id, kg: safeKg, item, recipientPhone: phone, notes });
    setBusy(false);
    if (r.error) return setError(r.error);
    router.replace({ pathname: '/reservation/[id]', params: { id: r.id! } });
  };

  const inputStyle = (name: string) => [styles.input, focus === name && { borderColor: colors.gold }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => router.back()} />
        <T v="h2">Réserver des kilos</T>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T v="title">{cityCode(l.from)}</T>
            <T v="title">{cityCode(l.to)}</T>
          </View>
          <FlightProgress progress={0.5} from={l.from} to={l.to} />
          <T v="small" color={colors.textMuted} style={{ marginTop: 6 }}>
            Départ {longDate(l.departDate)} · avec {l.traveler.name.split(' ')[0]}
          </T>
        </Card>

        <T v="title">Combien de kilos ?</T>
        <Stepper value={safeKg} onChange={setKg} min={1} max={Math.floor(l.remainingKg)} suffix={`sur ${l.remainingKg} kg disponibles`} />

        <T v="title">Votre colis</T>
        <TextInput
          value={item}
          onChangeText={setItem}
          multiline
          placeholder="Contenu du colis (ex. vêtements, 2 parfums scellés…)"
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocus('item')}
          onBlur={() => setFocus(null)}
          style={[...inputStyle('item'), { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
          maxLength={300}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Téléphone du destinataire (facultatif)"
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocus('phone')}
          onBlur={() => setFocus(null)}
          style={inputStyle('phone')}
        />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Un mot pour le voyageur : lieu et moment de remise… (facultatif)"
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocus('notes')}
          onBlur={() => setFocus(null)}
          style={[...inputStyle('notes'), { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 }]}
          maxLength={300}
        />

        <Card>
          <Line label={`${safeKg} kg × ${money(l.pricePerKg, l.currency)}`} value={money(base, l.currency)} />
          <Line label="Frais de service KiloFly (5 %)" value={money(serviceFee, l.currency)} />
          <Divider style={{ marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T v="h3">Total à payer</T>
            <T v="title" color={colors.goldBright}>
              {money(base + serviceFee, l.currency)}
            </T>
          </View>
        </Card>

        <View style={styles.how}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gold} />
          <T v="small" style={{ flex: 1 }}>
            Rien n’est débité maintenant. Le voyageur accepte d’abord votre demande, puis vous payez. L’argent reste bloqué jusqu’à la
            livraison.
          </T>
        </View>

        {error && (
          <T v="small" color={colors.danger}>
            {error}
          </T>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
        ) : (
          <Button title="Envoyer ma demande" icon="arrow-forward" onPress={submit} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <T v="body" color={colors.textMuted}>
        {label}
      </T>
      <T v="bodyStrong">{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  how: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSoft,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(3,15,30,0.94)' },
});
