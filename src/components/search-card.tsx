import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, T, tap, type IconName } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

/** "Rechercher / Proposer un voyage" card used on Home and Recherche. */
export function SearchCard({
  from,
  to,
  onFrom,
  onTo,
  onSearch,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <Card style={{ paddingTop: 6 }}>
      <View style={styles.tabs}>
        <View style={[styles.tab, styles.tabActive]}>
          <Ionicons name="airplane" size={15} color={colors.text} />
          <T v="caption" style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
            Rechercher un voyage
          </T>
        </View>
        <Pressable style={styles.tab} onPress={() => (tap(), router.push('/post-listing'))}>
          <Ionicons name="briefcase-outline" size={15} color={colors.textMuted} />
          <T v="caption" color={colors.textMuted} numberOfLines={1}>
            Proposer un voyage
          </T>
        </Pressable>
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        <Field icon="location-outline" label="Départ" placeholder="Ville ou pays de départ" value={from} onChange={onFrom} />
        <Field icon="location-outline" label="Destination" placeholder="Ville ou pays d’arrivée" value={to} onChange={onTo} />
        <Pressable
          style={styles.swap}
          onPress={() => {
            tap();
            onFrom(to);
            onTo(from);
          }}>
          <Ionicons name="swap-vertical" size={16} color={colors.text} />
        </Pressable>
        <Field icon="calendar-outline" label="Date" placeholder="Sélectionner une date" />
      </View>

      <Button title="Rechercher un voyage" leftIcon="search" style={{ marginTop: 16 }} onPress={onSearch} />
    </Card>
  );
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && { borderColor: colors.gold }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <T v="small" style={{ fontFamily: fonts.semibold, width: 82 }}>
        {label}
      </T>
      {onChange ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      ) : (
        <T v="small" color={colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
          {placeholder}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: colors.gold, marginBottom: -1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text, minWidth: 0 },
  swap: {
    position: 'absolute',
    right: -6,
    top: 38,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    zIndex: 2,
  },
});
