import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CalendarPicker } from '@/components/calendar-picker';
import { Button, Card, T, tap, type IconName } from '@/components/ui';
import { shortDate, toIsoDay } from '@/lib/listings';
import { colors, fonts, radius } from '@/theme';

export type SearchMode = 'trips' | 'requests';

/** Search card used on Home and Recherche: find a traveler (trips) or find parcels to carry (requests). */
export function SearchCard({
  mode = 'trips',
  onMode,
  from,
  to,
  onFrom,
  onTo,
  start,
  end,
  onDates,
  onSearch,
}: {
  mode?: SearchMode;
  onMode?: (m: SearchMode) => void;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  start?: string | null;
  end?: string | null;
  onDates?: (start: string | null, end: string | null) => void;
  onSearch: () => void;
}) {
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const today = toIsoDay(new Date());
  const max = toIsoDay(new Date(Date.now() + 365 * 864e5));
  const tabs: [SearchMode, IconName, string][] = [
    ['trips', 'airplane', 'Trouver un voyageur'],
    ['requests', 'cube-outline', 'Trouver des colis'],
  ];

  return (
    <Card style={{ paddingTop: onMode ? 6 : 16 }}>
      {onMode && (
      <View style={styles.tabs}>
        {tabs.map(([m, icon, label]) => {
          const active = mode === m;
          return (
            <Pressable key={m} style={[styles.tab, active && styles.tabActive]} onPress={() => (tap(), onMode?.(m))}>
              <Ionicons name={icon} size={15} color={active ? colors.text : colors.textMuted} />
              <T v="caption" color={active ? colors.text : colors.textMuted} style={active ? { fontFamily: fonts.semibold } : undefined} numberOfLines={1}>
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>
      )}

      <View style={{ gap: 10, marginTop: onMode ? 14 : 0 }}>
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <DateBox label="Du" value={start} onPress={() => setPicking('start')} />
          <DateBox label="Au" value={end} onPress={() => setPicking('end')} />
          {(start || end) && (
            <Pressable onPress={() => onDates?.(null, null)} style={styles.clear} hitSlop={6}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <Button
        title={mode === 'trips' ? 'Rechercher un voyage' : 'Rechercher des colis'}
        leftIcon="search"
        style={{ marginTop: 16 }}
        onPress={onSearch}
      />

      <CalendarPicker
        visible={picking !== null}
        title={picking === 'start' ? 'À partir du' : "Jusqu'au"}
        value={(picking === 'start' ? start : end) ?? null}
        minDate={picking === 'end' && start ? start : today}
        maxDate={max}
        onClose={() => setPicking(null)}
        onSelect={(iso) => {
          if (picking === 'start') onDates?.(iso, end && end < iso ? null : end ?? null);
          else onDates?.(start ?? null, iso);
          setPicking(null);
        }}
      />
    </Card>
  );
}

function DateBox({ label, value, onPress }: { label: string; value?: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={() => (tap(), onPress())} style={[styles.field, { flex: 1 }]}>
      <Ionicons name="calendar-outline" size={18} color={colors.text} />
      <T v="small" style={{ fontFamily: fonts.semibold }}>
        {label}
      </T>
      <T v="small" color={value ? colors.text : colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
        {value ? shortDate(value) : 'Date'}
      </T>
    </Pressable>
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
  clear: { width: 34, alignItems: 'center', justifyContent: 'center' },
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
