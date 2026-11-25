import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, T, tap } from '@/components/ui';
import { initialsOf } from '@/lib/auth';
import { cityCode } from '@/lib/cities';
import { money, shortDate } from '@/lib/listings';
import { STATUS_LABEL, type Reservation } from '@/lib/reservations';
import { colors, fonts, radius } from '@/theme';

export function StatusPill({ r }: { r: Reservation }) {
  const s = STATUS_LABEL[r.status];
  const color = s.tone === 'success' ? colors.success : s.tone === 'danger' ? colors.danger : s.tone === 'muted' ? colors.textMuted : colors.goldBright;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <T v="caption" color={color} style={{ fontFamily: fonts.semibold }}>
        {s[r.role]}
      </T>
    </View>
  );
}

/** Needs an action from me? (traveler: new request; sender: accepted → pay) */
export const needsMyAction = (r: Reservation) => (r.role === 'seller' && r.status === 'pending') || (r.role === 'buyer' && r.status === 'approved');

export function ReservationCard({ r }: { r: Reservation }) {
  const action = needsMyAction(r);
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push({ pathname: '/reservation/[id]', params: { id: r.id } });
      }}
      style={({ pressed }) => [styles.card, action && { borderColor: colors.borderGold }, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar photo={r.other.avatar ? { uri: r.other.avatar } : undefined} initials={initialsOf(r.other.name)} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="bodyStrong" numberOfLines={1}>
            {cityCode(r.from)} → {cityCode(r.to)} · {r.kg} kg
          </T>
          <T v="caption" color={colors.textMuted} numberOfLines={1}>
            {r.role === 'buyer' ? 'Voyageur' : 'Expéditeur'} : {r.other.name} · départ {shortDate(r.departDate)}
          </T>
        </View>
        <T v="bodyStrong" color={colors.goldBright}>
          {money(r.role === 'buyer' ? r.buyerTotal : r.sellerAmount, r.currency)}
        </T>
      </View>
      <View style={styles.bottom}>
        <StatusPill r={r} />
        {action && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <T v="caption" color={colors.gold}>
              {r.role === 'seller' ? 'Répondre' : 'Payer'}
            </T>
            <Ionicons name="arrow-forward" size={14} color={colors.gold} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
});
