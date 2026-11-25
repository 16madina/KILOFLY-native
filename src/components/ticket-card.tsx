import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, FlightProgress, GoldPill, Stars, T, tap, VerifiedBadge } from '@/components/ui';
import { cityCodes, cityImages, formatPrice, shortName, type Listing } from '@/data/mock';
import { colors, fonts, gradients, radius } from '@/theme';

/** Listing row: traveler | route | kilos & price, with a flight-progress strip underneath. */
export function TicketCard({ listing }: { listing: Listing }) {
  const l = listing;
  const booked = l.totalKg - l.availableKg;
  const ratio = booked / l.totalKg;
  const low = l.availableKg <= 5;

  return (
    <Pressable
      onPress={() => {
        tap();
        router.push(`/listing/${l.id}`);
      }}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}>
      <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />

      <View style={styles.top}>
        {/* Traveler, over a faint skyline of the destination */}
        <View style={styles.traveler}>
          <Image source={cityImages[l.to]} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="cover" />
          <LinearGradient colors={gradients.photoLeft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Avatar photo={l.traveler.photo} initials={l.traveler.initials} size={52} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <T v="small" style={{ fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
              {shortName(l.traveler.name)}
            </T>
            {l.traveler.verified && <VerifiedBadge size={15} />}
          </View>
          <Stars rating={l.traveler.rating} reviews={l.traveler.reviews} />
        </View>

        <View style={styles.sep} />

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.line}>
            <Ionicons name="airplane" size={15} color={colors.text} />
            <T v="small" style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
              {l.from} <T v="small" color={colors.textMuted}>({cityCodes[l.from]})</T>
            </T>
          </View>
          <View style={styles.line}>
            <Ionicons name="arrow-forward" size={15} color={colors.text} />
            <T v="small" style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
              {l.to} <T v="small" color={colors.textMuted}>({cityCodes[l.to]})</T>
            </T>
          </View>
          <View style={[styles.line, { marginTop: 4 }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <T v="small" color={colors.textMuted} numberOfLines={1}>
              {l.departDate.replace(/^\S+ /, '')}
            </T>
          </View>
        </View>

        <View style={styles.sep} />

        {/* Kilos & price */}
        <View style={styles.price}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="briefcase-outline" size={15} color={colors.gold} />
            <T v="bodyStrong">{l.availableKg} kg</T>
          </View>
          <T v="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
            disponibles
          </T>
          <GoldPill label={`${formatPrice(l.pricePerKg, l.currency)}/kg`} style={{ alignSelf: 'center' }} />
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
            {l.availableKg === 0 ? 'Complet' : low ? 'Bientôt complet' : `Reste ${l.availableKg} kg`}
          </T>
        </View>
        <FlightProgress progress={ratio} from={cityCodes[l.from]} to={cityCodes[l.to]} />
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
  price: { width: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  progress: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
});
