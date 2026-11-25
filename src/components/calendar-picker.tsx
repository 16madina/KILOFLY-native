import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, T, tap } from '@/components/ui';
import { longDate, toIsoDay } from '@/lib/listings';
import { colors, fonts, radius, shadow } from '@/theme';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // weeks start on Monday

const fromIso = (iso: string) => new Date(`${iso}T12:00:00`);

/** Month-by-month date picker in a bottom sheet. Dates before `minDate` and after `maxDate` are disabled. */
export function CalendarPicker({
  visible,
  title,
  value,
  minDate,
  maxDate,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  value: string | null;
  minDate: string;
  maxDate: string;
  onClose: () => void;
  onSelect: (iso: string) => void;
}) {
  const start = value ?? minDate;
  const [month, setMonth] = useState(() => {
    const d = fromIso(start);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState<string | null>(value);

  useEffect(() => {
    if (!visible) return;
    const d = fromIso(value ?? minDate);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setPicked(value);
  }, [visible, value, minDate]);

  const min = fromIso(minDate);
  const max = fromIso(maxDate);
  const canPrev = new Date(month.getFullYear(), month.getMonth(), 1) > new Date(min.getFullYear(), min.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= max;

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= count; d++) out.push(toIsoDay(new Date(month.getFullYear(), month.getMonth(), d)));
    // Always 6 weeks, so the sheet keeps the same height and the arrows don't move under the finger.
    while (out.length < 42) out.push(null);
    return out;
  }, [month]);

  const today = toIsoDay(new Date());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T v="h2">{title}</T>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.monthRow}>
          <Pressable
            disabled={!canPrev}
            onPress={() => (tap(), setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)))}
            style={[styles.arrow, !canPrev && { opacity: 0.3 }]}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <T v="h2" style={{ fontFamily: fonts.serifItalic, color: colors.goldBright }}>
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </T>
          <Pressable
            disabled={!canNext}
            onPress={() => (tap(), setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)))}
            style={[styles.arrow, !canNext && { opacity: 0.3 }]}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {WEEKDAYS.map((w, i) => (
            <View key={`w${i}`} style={styles.cell}>
              <T v="caption" color={colors.textFaint}>
                {w}
              </T>
            </View>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <View key={`e${i}`} style={styles.cell} />;
            const disabled = iso < minDate || iso > maxDate;
            const active = iso === picked;
            return (
              <View key={iso} style={styles.cell}>
                <Pressable
                  disabled={disabled}
                  onPress={() => (tap(), setPicked(iso))}
                  style={[styles.day, iso === today && styles.today, active && styles.dayActive, disabled && { opacity: 0.25 }]}>
                  <T v="bodyStrong" color={active ? colors.onGold : colors.text}>
                    {Number(iso.slice(8))}
                  </T>
                </Pressable>
              </View>
            );
          })}
        </View>

        <T v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 4 }}>
          {picked ? longDate(picked) : 'Choisissez un jour'}
        </T>
        <Button
          title="Valider cette date"
          icon="checkmark"
          style={{ marginTop: 14, opacity: picked ? 1 : 0.5 }}
          onPress={() => {
            if (!picked) return;
            onSelect(picked);
            onClose();
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.borderGold,
    ...shadow.card,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 10 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: '86%', height: '86%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1, borderColor: colors.borderGold },
  dayActive: { backgroundColor: colors.gold },
});
