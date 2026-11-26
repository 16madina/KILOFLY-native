// Country picker (with flags), city suggestions for that country, and phone with automatic dial code.
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, tap } from '@/components/ui';
import { COUNTRIES, searchCountries, type Country } from '@/data/countries';
import { WORLD_CITIES } from '@/data/world-cities';
import { colors, fonts, radius } from '@/theme';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function Label({ text }: { text: string }) {
  return (
    <T v="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
      {text}
    </T>
  );
}

export function CountryField({ value, onChange }: { value: Country | undefined; onChange: (c: Country) => void }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => (q ? searchCountries(q, 60) : COUNTRIES), [q]);

  return (
    <View>
      <Label text="Pays" />
      <Pressable onPress={() => (tap(), setOpen(true))} style={styles.field}>
        <T v="body" style={{ fontSize: 20 }}>
          {value?.flag ?? '🌍'}
        </T>
        <T v="body" color={value ? colors.text : colors.textFaint} style={{ flex: 1 }}>
          {value?.name ?? 'Choisir votre pays'}
        </T>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={[styles.field, { flex: 1 }]}>
              <Ionicons name="search" size={18} color={colors.textFaint} />
              <TextInput
                autoFocus
                value={q}
                onChangeText={setQ}
                placeholder="Rechercher un pays"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                autoCorrect={false}
              />
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <T v="bodyStrong" color={colors.gold}>
                Fermer
              </T>
            </Pressable>
          </View>
          <FlatList
            data={list}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  tap();
                  onChange(item);
                  setQ('');
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardHi }]}>
                <T v="body" style={{ fontSize: 22 }}>
                  {item.flag}
                </T>
                <T v="body" style={{ flex: 1 }}>
                  {item.name}
                </T>
                <T v="small" color={colors.textMuted}>
                  {item.dial}
                </T>
                {value?.code === item.code && <Ionicons name="checkmark" size={18} color={colors.gold} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export function CityField({ value, onChange, countryCode }: { value: string; onChange: (v: string) => void; countryCode?: string }) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => {
    const n = norm(value);
    if (!focused || !n) return [];
    const pool = countryCode ? WORLD_CITIES.filter((c) => c.countryCode === countryCode) : WORLD_CITIES;
    const seen = new Set<string>();
    const starts = pool.filter((c) => norm(c.city).startsWith(n));
    const contains = pool.filter((c) => !norm(c.city).startsWith(n) && norm(c.city).includes(n));
    return [...starts, ...contains]
      .filter((c) => (seen.has(c.city) ? false : (seen.add(c.city), true)))
      .filter((c) => norm(c.city) !== n)
      .slice(0, 6);
  }, [value, focused, countryCode]);

  return (
    <View>
      <Label text="Ville" />
      <View style={styles.field}>
        <Ionicons name="business-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={countryCode ? 'Commencez à taper votre ville' : "Choisissez d'abord votre pays"}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggest}>
          {suggestions.map((c, i) => (
            <Pressable
              key={c.city + c.countryCode}
              onPress={() => {
                tap();
                onChange(c.city);
                setFocused(false);
              }}
              style={({ pressed }) => [styles.row, i > 0 && styles.sep, pressed && { backgroundColor: colors.cardHi }]}>
              <Ionicons name="location-outline" size={16} color={colors.gold} />
              <T v="body" style={{ flex: 1 }}>
                {c.city}
              </T>
              {!countryCode && <T v="small">{c.flag}</T>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** Local number input with the country's dial code in front. */
export function PhoneField({ country, value, onChange }: { country: Country | undefined; value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Label text="Téléphone" />
      <View style={styles.field}>
        <View style={styles.dial}>
          <T v="body" style={{ fontSize: 18 }}>
            {country?.flag ?? '🌍'}
          </T>
          <T v="bodyStrong">{country?.dial ?? '+'}</T>
        </View>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^\d ]/g, ''))}
          placeholder="Numéro"
          placeholderTextColor={colors.textFaint}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>
    </View>
  );
}

/** Splits a stored "+221 77 123 45 67" into the local part when it matches the country's code. */
export function localPart(phone: string | null | undefined, country: Country | undefined): string {
  const p = (phone ?? '').trim();
  if (!p) return '';
  if (country && p.replace(/\s/g, '').startsWith(country.dial)) return p.replace(/\s/g, '').slice(country.dial.length);
  return p.startsWith('+') ? p : p;
}

export function fullPhone(local: string, country: Country | undefined): string {
  const digits = local.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return country ? `${country.dial} ${digits}` : digits;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 12 },
  dial: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10, borderRightWidth: 1, borderRightColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  suggest: { marginTop: 6, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderGold, overflow: 'hidden' },
});
