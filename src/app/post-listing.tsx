import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, T, tap } from '@/components/ui';
import { cityCodes, type City } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const steps = ['Trajet', 'Capacité', 'Conditions'];
const cities = Object.keys(cityCodes) as City[];
const itemOptions = ['Vêtements', 'Documents', 'Électronique', 'Cosmétiques', 'Chaussures', 'Livres', 'Tissus', 'Médicaments'];

export default function PostListing() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState<City>('Paris');
  const [to, setTo] = useState<City>('Dakar');
  const [kg, setKg] = useState(20);
  const [price, setPrice] = useState('9');
  const [items, setItems] = useState<string[]>(['Vêtements', 'Documents']);

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : router.back());

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close" onPress={() => router.back()} />
        <T v="h3">Nouveau trajet</T>
        <View style={{ width: 42 }} />
      </View>

      {/* Stepper */}
      <View style={styles.steps}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 6 }}>
            <View style={[styles.stepBar, i <= step && { backgroundColor: colors.gold }]} />
            <T v="caption" color={i <= step ? colors.gold : colors.textFaint} style={{ fontFamily: fonts.bold }}>
              {i + 1}. {s}
            </T>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}>
        {step === 0 && (
          <>
            <T v="title">D’où partez-vous ?</T>
            <CityPicker value={from} onChange={setFrom} />
            <T v="title">Et vous allez…</T>
            <CityPicker value={to} onChange={setTo} />
            <Field icon="calendar-outline" label="Date de départ" value="Ven. 5 décembre 2026 · 10:35" />
            <Field icon="calendar-outline" label="Date d’arrivée" value="Ven. 5 décembre 2026 · 15:10" />
          </>
        )}

        {step === 1 && (
          <>
            <T v="title">Combien de kilos proposez-vous ?</T>
            <View style={styles.bigStepper}>
              <Pressable style={styles.bigBtn} onPress={() => (tap(), setKg(Math.max(1, kg - 1)))}>
                <Ionicons name="remove" size={26} color={colors.gold} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <T v="display" style={{ fontSize: 56, lineHeight: 62 }}>
                  {kg}
                </T>
                <T v="small" color={colors.textMuted}>
                  kilos
                </T>
              </View>
              <Pressable style={[styles.bigBtn, { backgroundColor: colors.gold }]} onPress={() => (tap(), setKg(Math.min(46, kg + 1)))}>
                <Ionicons name="add" size={26} color={colors.onGold} />
              </Pressable>
            </View>
            <T v="title">Prix par kilo</T>
            <View style={styles.priceBox}>
              <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.priceInput} />
              <T v="title" color={colors.textMuted}>
                € / kg
              </T>
            </View>
            <View style={styles.hint}>
              <Ionicons name="trending-up" size={18} color={colors.success} />
              <T v="small" style={{ flex: 1 }}>
                Sur Paris → Dakar, le prix moyen est de <T v="small" style={{ fontFamily: fonts.bold }}>8–10 € / kg</T>. Gain potentiel :{' '}
                <T v="small" style={{ fontFamily: fonts.bold }} color={colors.success}>
                  {kg * Number(price || 0)} €
                </T>
              </T>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <T v="title">Qu’acceptez-vous de transporter ?</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {itemOptions.map((it) => (
                <Chip
                  key={it}
                  label={it}
                  active={items.includes(it)}
                  icon={items.includes(it) ? 'checkmark' : undefined}
                  onPress={() => setItems(items.includes(it) ? items.filter((x) => x !== it) : [...items, it])}
                />
              ))}
            </View>
            <T v="title">Un mot pour les expéditeurs</T>
            <TextInput
              multiline
              placeholder="Lieu de remise, horaires, conditions…"
              placeholderTextColor={colors.textFaint}
              style={styles.textarea}
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step > 0 && <Button title="Retour" variant="dark" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
        <Button title={step === steps.length - 1 ? 'Publier le trajet' : 'Continuer'} icon="arrow-forward" onPress={next} style={{ flex: 2 }} />
      </View>
    </View>
  );
}

function CityPicker({ value, onChange }: { value: City; onChange: (c: City) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
      {cities.map((c) => (
        <Pressable key={c} onPress={() => (tap(), onChange(c))} style={[styles.city, value === c && styles.cityActive]}>
          <T v="h3" color={value === c ? colors.goldBright : colors.text}>
            {cityCodes[c]}
          </T>
          <T v="caption" color={value === c ? colors.textMuted : colors.textMuted}>
            {c}
          </T>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Field({ icon, label, value }: { icon: 'calendar-outline'; label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <View style={{ flex: 1 }}>
        <T v="caption" color={colors.textMuted}>
          {label}
        </T>
        <T v="bodyStrong">{value}</T>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  steps: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  stepBar: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  city: {
    width: 92,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  cityActive: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
  },
  bigBtn: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  priceInput: { flex: 1, fontFamily: fonts.serif, fontSize: 32, color: colors.text },
  hint: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.successSoft },
  textarea: {
    minHeight: 120,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, backgroundColor: colors.bg },
});
