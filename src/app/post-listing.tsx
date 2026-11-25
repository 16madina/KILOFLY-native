import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityField, DateStrip, Segmented, Stepper } from '@/components/listing-bits';
import { Button, Card, Chip, IconButton, T, tap } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  createListing,
  currencySymbol,
  DELIVERY_OPTIONS,
  ITEM_OPTIONS,
  money,
  PROHIBITED_DEFAULTS,
  toIsoDay,
  type Currency,
} from '@/lib/listings';
import { colors, fonts, radius } from '@/theme';

const steps = ['Trajet', 'Capacité', 'Conditions'];

export default function PostListing() {
  const insets = useSafeAreaInsets();
  const { loading: authLoading, session, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState<string | null>(null);
  const [arriveDate, setArriveDate] = useState<string | null>(null);
  const [kg, setKg] = useState(20);
  const [price, setPrice] = useState('9');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [allowed, setAllowed] = useState<string[]>(['Vêtements', 'Documents']);
  const [prohibited, setProhibited] = useState<string[]>(PROHIBITED_DEFAULTS);
  const [delivery, setDelivery] = useState('pickup');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsId, setNeedsId] = useState(false);
  const [priceFocused, setPriceFocused] = useState(false);

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href="/auth" />;

  const priceNum = Number(price.replace(',', '.'));
  const toggle = (list: string[], set: (v: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (from.trim().length < 2 || to.trim().length < 2) return 'Indiquez la ville de départ et la ville d’arrivée.';
      if (from.trim().toLowerCase() === to.trim().toLowerCase()) return 'Le départ et l’arrivée doivent être différents.';
      if (!departDate) return 'Choisissez votre date de départ.';
      if (arriveDate && arriveDate < departDate) return 'L’arrivée ne peut pas être avant le départ.';
    }
    if (s === 1 && !(priceNum > 0)) return 'Indiquez un prix par kilo valide.';
    return null;
  };

  const next = async () => {
    const v = validate(step);
    if (v) return setError(v);
    setError(null);
    if (step < steps.length - 1) return setStep(step + 1);

    setBusy(true);
    const r = await createListing(session.user.id, {
      from,
      to,
      departDate: departDate!,
      arriveDate: arriveDate ?? departDate!,
      kg,
      pricePerKg: priceNum,
      currency,
      allowed,
      prohibited,
      deliveryOption: delivery,
      description,
    });
    setBusy(false);
    if (r.error === 'identity') return setNeedsId(true);
    if (r.error) return setError(r.error);
    router.replace(`/listing/${r.id}`);
  };

  if (needsId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16, paddingHorizontal: 16, gap: 16 }}>
        <IconButton icon="close" onPress={() => router.back()} />
        <Card gold style={{ alignItems: 'center', gap: 12, paddingVertical: 26 }}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.gold} />
          <T v="h2" style={{ textAlign: 'center' }}>
            Vérifiez votre identité pour publier
          </T>
          <T v="small" color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 300 }}>
            Pour la sécurité des expéditeurs, seuls les voyageurs dont la pièce d’identité a été vérifiée peuvent proposer des kilos.
            La vérification arrive bientôt dans votre profil.
          </T>
          <Button title="Retour" small variant="outline" onPress={() => setNeedsId(false)} />
        </Card>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/post'))} />
        <T v="h2">Nouveau trajet</T>
        <View style={{ width: 46 }} />
      </View>

      <View style={styles.steps}>
        {steps.map((s, i) => (
          <Pressable key={s} style={{ flex: 1, gap: 6 }} onPress={() => i < step && setStep(i)}>
            <View style={[styles.stepBar, i <= step && { backgroundColor: colors.gold }]} />
            <T v="caption" color={i <= step ? colors.gold : colors.textFaint} style={{ fontFamily: fonts.semibold }}>
              {i + 1}. {s}
            </T>
          </Pressable>
        ))}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 18 }}>
        {step === 0 && (
          <>
            <T v="title">Votre trajet</T>
            {profile && !profile.id_verified && (
              <View style={styles.idNote}>
                <Ionicons name="shield-outline" size={18} color={colors.warning} />
                <T v="small" style={{ flex: 1 }}>
                  Votre identité n’est pas encore vérifiée : la publication d’un trajet sera refusée tant qu’elle ne l’est pas.
                </T>
              </View>
            )}
            <CityField label="Ville de départ" value={from} onChange={setFrom} placeholder="Ex. Paris" />
            <CityField label="Ville d’arrivée" value={to} onChange={setTo} placeholder="Ex. Dakar" icon="flag-outline" />
            <DateStrip
              label="Date de départ"
              value={departDate}
              onChange={(d) => {
                setDepartDate(d);
                if (d && arriveDate && arriveDate < d) setArriveDate(d);
              }}
            />
            <DateStrip
              label="Date d’arrivée (si différente)"
              value={arriveDate}
              onChange={setArriveDate}
              minDate={departDate ?? toIsoDay(new Date())}
              days={14}
              maxMonths={2}
              allowEmpty
            />
          </>
        )}

        {step === 1 && (
          <>
            <T v="title">Combien de kilos proposez-vous ?</T>
            <Stepper value={kg} onChange={setKg} min={1} max={46} suffix="kilos" />
            <T v="title">Prix par kilo</T>
            <Segmented
              options={[
                ['EUR', 'Euro €'],
                ['USD', 'Dollar $'],
                ['XOF', 'FCFA'],
              ]}
              value={currency}
              onChange={setCurrency}
            />
            <View style={[styles.priceBox, priceFocused && { borderColor: colors.gold }]}>
              <TextInput
                value={price}
                onChangeText={(v) => setPrice(v.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                onFocus={() => setPriceFocused(true)}
                onBlur={() => setPriceFocused(false)}
                style={styles.priceInput}
              />
              <T v="title" color={colors.textMuted}>
                {currencySymbol(currency)} / kg
              </T>
            </View>
            {priceNum > 0 && (
              <View style={styles.hint}>
                <Ionicons name="trending-up" size={18} color={colors.success} />
                <T v="small" style={{ flex: 1 }}>
                  Si tout est réservé, vous gagnez{' '}
                  <T v="small" color={colors.success} style={{ fontFamily: fonts.bold }}>
                    {money(kg * priceNum, currency)}
                  </T>{' '}
                  (avant frais KiloFly).
                </T>
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <T v="title">Ce que vous acceptez</T>
            <View style={styles.chips}>
              {ITEM_OPTIONS.map((it) => (
                <Chip key={it} label={it} active={allowed.includes(it)} icon={allowed.includes(it) ? 'checkmark' : undefined} onPress={() => toggle(allowed, setAllowed, it)} />
              ))}
            </View>
            <T v="title">Ce que vous refusez</T>
            <View style={styles.chips}>
              {[...PROHIBITED_DEFAULTS, 'Médicaments sans ordonnance', 'Objets fragiles'].map((it) => (
                <Chip key={it} label={it} active={prohibited.includes(it)} icon={prohibited.includes(it) ? 'close' : undefined} onPress={() => toggle(prohibited, setProhibited, it)} />
              ))}
            </View>
            <T v="title">Remise du colis</T>
            <View style={{ gap: 8 }}>
              {Object.entries(DELIVERY_OPTIONS).map(([k, o]) => (
                <Pressable key={k} onPress={() => (tap(), setDelivery(k))} style={[styles.option, delivery === k && styles.optionActive]}>
                  <View style={[styles.radio, delivery === k && { borderColor: colors.gold }]}>{delivery === k && <View style={styles.radioDot} />}</View>
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong">{o.label}</T>
                    <T v="caption" color={colors.textMuted}>
                      {o.description}
                    </T>
                  </View>
                </Pressable>
              ))}
            </View>
            <T v="title">Un mot pour les expéditeurs</T>
            <TextInput
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Lieu de remise, horaires, conditions…"
              placeholderTextColor={colors.textFaint}
              style={styles.textarea}
              maxLength={500}
            />
          </>
        )}

        {error && (
          <T v="small" color={colors.danger}>
            {error}
          </T>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ height: 56, flex: 1 }} />
        ) : (
          <>
            {step > 0 && <Button title="Retour" variant="dark" onPress={() => (setError(null), setStep(step - 1))} style={{ flex: 1 }} />}
            <Button title={step === steps.length - 1 ? 'Publier le trajet' : 'Continuer'} icon="arrow-forward" onPress={next} style={{ flex: 2 }} />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  steps: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  stepBar: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  priceInput: { flex: 1, fontFamily: fonts.serif, fontSize: 32, color: colors.text, minWidth: 0 },
  hint: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.successSoft },
  idNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233,162,59,0.4)',
    backgroundColor: colors.warningSoft,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  textarea: {
    minHeight: 110,
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
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: 'rgba(3,15,30,0.94)' },
});
