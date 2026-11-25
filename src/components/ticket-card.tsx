import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, FlightProgress, GoldPill, Stars, T, tap, VerifiedBadge } from '@/components/ui';
import { initialsOf } from '@/lib/auth';
import { cityCode, cityImage } from '@/lib/cities';
import { money, shortDate, type ListingCard } from '@/lib/listings';
import { colors, fonts, gradients, radius } from '@/theme';

const STATUS: Record<string, string> = { cancelled: 'Annulée', completed: 'Terminée', archived: 'Passée' };

const shortName = (name: string) => {
  const p = name.split(' ').filter(Boolean);
  return p.length > 1 ? `${p[0]} ${p[1][0]}.` : name;
};

/** Listing row: traveler | route | kilos & price, with a flight-progress strip underneath. */
export function TicketCard({ listing }: { listing: ListingCard }) {
  const l = listing;
  const booked = Math.max(0, l.totalKg - l.remainingKg);
  const ratio = l.totalKg > 0 ? booked / l.totalKg : 0;
  const low = l.remainingKg > 0 && l.remainingKg <= 5;
  const inactive = l.status !== 'active';

  return (
    <Pressable
      onPress={() => {
        tap();
        router.push(`/listing/${l.id}`);
      }}
      style={({ pressed }) => [styles.card, inactive && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.985 }] }]}>
      <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />

      <View style={styles.top}>
        {/* Traveler, over a faint skyline of the destination */}
        <View style={styles.traveler}>
          <Image source={cityImage(l.to)} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="cover" />
          <LinearGradient colors={gradients.photoLeft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Avatar
            photo={l.traveler.avatar ? { uri: l.traveler.avatar } : undefined}
            initials={initialsOf(l.traveler.name)}
            size={52}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <T v="small" style={{ fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
              {shortName(l.traveler.name)}
            </T>
            {l.traveler.verified && <VerifiedBadge size={15} />}
          </View>
          {l.traveler.rating !== null ? (
            <Stars rating={l.traveler.rating} reviews={l.traveler.reviews} />
          ) : (
            <T v="caption" color={colors.textFaint}>
              Nouveau
            </T>
          )}
        </View>

        <View style={styles.sep} />

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.line}>
            <Ionicons name="airplane" size={15} color={colors.text} />
            <T v="small" style={{ fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
              {l.from} <T v="small" color={colors.textMuted}>({cityCode(l.from)})</T>
            </T>
          </View>
          <View style={styles.line}>
            <Ionicons name="arrow-forward" size={15} color={colors.text} />
            <T v="small" style={{ fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
              {l.to} <T v="small" color={colors.textMuted}>({cityCode(l.to)})</T>
            </T>
          </View>
          <View style={[styles.line, { marginTop: 4 }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <T v="small" color={colors.textMuted} numberOfLines={1}>
              {shortDate(l.departDate)}
            </T>
            {inactive && (
              <View style={styles.status}>
                <T v="caption" color={colors.textMuted}>
                  {STATUS[l.status] ?? l.status}
                </T>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sep} />

        {/* Kilos & price */}
        <View style={styles.price}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="briefcase-outline" size={15} color={colors.gold} />
            <T v="bodyStrong">{l.remainingKg} kg</T>
          </View>
          <T v="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
            disponibles
          </T>
          <GoldPill label={`${money(l.pricePerKg, l.currency)}/kg`} style={{ alignSelf: 'center' }} />
        </View>
      </View>

      {/* Flight progress — plane advances as the suitcase fills up */}
      <View style={styles.progress}>
        <View style={styles.progressHead}>
          <T v="caption" color={colors.textMuted}>
            <T v="caption" style={{ fontFamily: fonts.semibold }}>
              {booked}/{l.totalKg} kg
            </T>{' '}
            réservés
          </T>
          <T v="caption" color={low ? colors.warning : colors.gold} style={{ fontFamily: fonts.semibold }}>
            {l.remainingKg === 0 ? 'Complet' : low ? 'Bientôt complet' : `Reste ${l.remainingKg} kg`}
          </T>
        </View>
        <FlightProgress progress={ratio} from={cityCode(l.from)} to={cityCode(l.to)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.card },
  top: { flexDirection: 'row', minHeight: 128 },
  traveler: { width: 104, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6, overflow: 'hidden' },
  sep: { width: 1, marginVertical: 14, backgroundColor: colors.border },
  route: { flex: 1, justifyContent: 'center', paddingHorizontal: 10, gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  status: { marginLeft: 'auto', paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong },
  price: { width: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  progress: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
});
