import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Card, GoldPill, T, tap, type IconName } from '@/components/ui';
import { initialsOf } from '@/lib/auth';
import { searchCities } from '@/lib/cities';
import { CalendarPicker } from '@/components/calendar-picker';
import { longDate, money, shortDate, toIsoDay, type RequestCard } from '@/lib/listings';
import { colors, fonts, radius } from '@/theme';

/* ---------- Request card ---------- */

export function RequestRow({ r, right, onPress }: { r: RequestCard; right?: ReactNode; onPress?: () => void }) {
  const when = r.dateEnd ? `${shortDate(r.dateStart)} – ${shortDate(r.dateEnd)}` : `dès le ${shortDate(r.dateStart)}`;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.request}>
      <Avatar photo={r.requester.avatar ? { uri: r.requester.avatar } : undefined} initials={initialsOf(r.requester.name)} size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="bodyStrong" numberOfLines={1}>
          {r.from} → {r.to}
        </T>
        <T v="caption" color={colors.textMuted} numberOfLines={1}>
          {r.kg} kg · {when}
          {r.description ? ` · ${r.description}` : ''}
        </T>
      </View>
      {right ?? (r.budgetMax ? <GoldPill label={`≤ ${money(r.budgetMax, r.currency)}`} /> : null)}
    </Pressable>
  );
}

/* ---------- States ---------- */

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 26 }}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.gold} />
      </View>
      <T v="h2" style={{ textAlign: 'center', fontSize: 19 }}>
        {title}
      </T>
      <T v="small" color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 280 }}>
        {text}
      </T>
      {action}
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

export function ErrorNote({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <Pressable onPress={onRetry} style={styles.error}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.danger} />
      <T v="small" style={{ flex: 1 }}>
        Impossible de charger les données. {onRetry ? 'Touchez pour réessayer.' : ''}
      </T>
      <T v="caption" color={colors.textFaint} numberOfLines={1} style={{ maxWidth: 90 }}>
        {text}
      </T>
    </Pressable>
  );
}

/* ---------- City field with suggestions ---------- */

export function CityField({
  label,
  value,
  onChange,
  placeholder = 'Ville',
  icon = 'location-outline',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => (focused ? searchCities(value, 6) : []), [focused, value]);
  const exact = suggestions.length === 1 && suggestions[0].city.toLowerCase() === value.trim().toLowerCase();

  return (
    <View>
      <T v="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={[styles.field, focused && { borderColor: colors.gold }]}>
        <Ionicons name={icon} size={19} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={styles.input}
        />
        {!!value && (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        )}
      </View>
      {suggestions.length > 0 && !exact && (
        <View style={styles.suggestions}>
          {suggestions.map((c) => (
            <Pressable
              key={`${c.city}-${c.countryCode}`}
              onPress={() => {
                tap();
                onChange(c.city);
                setFocused(false);
              }}
              style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.cardHi }]}>
              <T v="body">{c.flag}</T>
              <T v="small" style={{ fontFamily: fonts.medium }}>
                {c.city}
              </T>
              <T v="caption" color={colors.textMuted}>
                {c.country}
              </T>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/* ---------- Date strip: quick picks + full calendar ---------- */

const WD = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MO = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const isoToDate = (iso: string) => new Date(`${iso}T12:00:00`);

export function DateStrip({
  label,
  value,
  onChange,
  minDate,
  days = 21,
  maxMonths = 12,
  allowEmpty,
}: {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  minDate?: string;
  /** Number of quick-pick days shown in the strip. */
  days?: number;
  /** How far ahead the calendar goes. */
  maxMonths?: number;
  allowEmpty?: boolean;
}) {
  const [calendar, setCalendar] = useState(false);
  const min = minDate ?? toIsoDay(new Date());
  const max = useMemo(() => {
    const d = isoToDate(min);
    d.setMonth(d.getMonth() + maxMonths);
    return toIsoDay(d);
  }, [min, maxMonths]);

  const list = useMemo(() => {
    const start = isoToDate(min);
    const out = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toIsoDay(d);
    });
    // A date picked in the calendar beyond the quick range is shown first.
    if (value && !out.includes(value)) out.unshift(value);
    return out;
  }, [min, days, value]);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <T v="caption" color={colors.textMuted}>
          {label}
        </T>
        {allowEmpty && value && (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <T v="caption" color={colors.gold}>
              Effacer
            </T>
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Pressable onPress={() => (tap(), setCalendar(true))} style={[styles.day, styles.dayCalendar]}>
          <Ionicons name="calendar" size={20} color={colors.gold} />
          <T v="caption" color={colors.gold} style={{ textAlign: 'center', marginTop: 2 }}>
            Autre{'\n'}date
          </T>
        </Pressable>
        {list.map((iso) => {
          const d = isoToDate(iso);
          const active = iso === value;
          return (
            <Pressable key={iso} onPress={() => (tap(), onChange(iso))} style={[styles.day, active && styles.dayActive]}>
              <T v="caption" color={active ? colors.onGold : colors.textMuted}>
                {WD[d.getDay()]}
              </T>
              <T v="h3" color={active ? colors.onGold : colors.text} style={{ fontFamily: fonts.serif, fontSize: 20 }}>
                {d.getDate()}
              </T>
              <T v="caption" color={active ? colors.onGold : colors.textMuted}>
                {MO[d.getMonth()]}
                {d.getFullYear() !== new Date().getFullYear() ? ` ${String(d.getFullYear()).slice(2)}` : ''}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
      {value && (
        <T v="caption" color={colors.gold} style={{ marginTop: 6 }}>
          {longDate(value)}
        </T>
      )}
      <CalendarPicker
        visible={calendar}
        title={label}
        value={value}
        minDate={min}
        maxDate={max}
        onClose={() => setCalendar(false)}
        onSelect={(iso) => onChange(iso)}
      />
    </View>
  );
}

/* ---------- Numeric stepper ---------- */

export function Stepper({ value, onChange, min = 1, max = 50, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => (tap(), onChange(Math.max(min, value - 1)))}>
        <Ionicons name="remove" size={22} color={colors.text} />
      </Pressable>
      <View style={{ alignItems: 'center', minWidth: 80 }}>
        <T v="display" style={{ fontSize: 40, lineHeight: 46 }}>
          {value}
        </T>
        {suffix && (
          <T v="caption" color={colors.textMuted}>
            {suffix}
          </T>
        )}
      </View>
      <Pressable style={[styles.stepBtn, styles.stepBtnGold]} onPress={() => (tap(), onChange(Math.min(max, value + 1)))}>
        <Ionicons name="add" size={22} color={colors.onGold} />
      </Pressable>
    </View>
  );
}

/* ---------- Choice chips (single) ---------- */

export function Segmented<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map(([k, label]) => (
        <Pressable key={k} onPress={() => (tap(), onChange(k))} style={[styles.segItem, value === k && styles.segActive]}>
          <T v="small" color={value === k ? colors.text : colors.textMuted} style={{ fontFamily: fonts.semibold }}>
            {label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  request: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229,103,95,0.4)',
    backgroundColor: colors.dangerSoft,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, minWidth: 0 },
  suggestions: {
    marginTop: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  day: {
    width: 62,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  dayActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayCalendar: { justifyContent: 'center', borderColor: colors.borderGold, backgroundColor: colors.goldSoft },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  stepBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  stepBtnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  segItem: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.borderGold },
});
