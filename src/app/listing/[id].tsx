import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  Avatar,
  BackButton,
  BrandHeader,
  Button,
  Card,
  Divider,
  FlightProgress,
  GoldPill,
  Stars,
  T,
  tap,
  VerifiedBadge,
  type IconName,
} from '@/components/ui';
import { requireAuth } from '@/components/sign-in-prompt';
import { useAuth } from '@/lib/auth';
import { cityCodes, cityImages, formatPrice, listings, shortName } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const allowedIcons: Record<string, IconName> = {
  Vêtements: 'shirt-outline',
  Documents: 'document-text-outline',
  Cosmétiques: 'color-palette-outline',
  'Électronique scellée': 'phone-portrait-outline',
  Électronique: 'phone-portrait-outline',
  Chaussures: 'footsteps-outline',
  Livres: 'book-outline',
  Tissus: 'cut-outline',
  'Épices emballées': 'leaf-outline',
  Artisanat: 'gift-outline',
};
const refusedIcons: Record<string, IconName> = {
  'Liquides > 100 ml': 'wine-outline',
  Liquides: 'wine-outline',
  'Nourriture fraîche': 'snow-outline',
  Nourriture: 'snow-outline',
  'Batteries seules': 'battery-dead-outline',
  'Médicaments sans ordonnance': 'medkit-outline',
  'Poisson séché': 'fish-outline',
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const l = listings.find((x) => x.id === id) ?? listings[0];
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [kg, setKg] = useState(Math.min(3, l.availableKg));
  const booked = l.totalKg - l.availableKg;
  const first = l.traveler.name.split(' ')[0];

  const step = (d: number) => {
    tap();
    setKg((k) => Math.max(1, Math.min(l.availableKg, k + d)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <BrandHeader top={insets.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
            <BackButton />
            <T v="title">Détail du voyage</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Ionicons name="briefcase-outline" size={18} color={colors.gold} />
            <T v="body" color={colors.gold}>
              Offre de voyageur vérifié
            </T>
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 14 }}>
          {/* Traveler */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => {}}>
            <Image source={cityImages[l.to]} style={[styles.skyline]} contentFit="cover" />
            <LinearGradient colors={['#111E2E', 'rgba(17,30,46,0.5)']} start={{ x: 0.35, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Avatar photo={l.traveler.photo} initials={l.traveler.initials} size={78} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T v="h2" style={{ fontSize: 23 }}>
                  {shortName(l.traveler.name)}
                </T>
                {l.traveler.verified && <VerifiedBadge size={20} />}
              </View>
              <Stars rating={l.traveler.rating} reviews={l.traveler.reviews} size="large" />
              <Divider style={{ marginVertical: 4 }} />
              <T v="small" color={colors.textMuted}>
                Voyageur vérifié depuis {l.traveler.memberSince}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Card>

          {/* Route */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Ionicons name="airplane" size={18} color={colors.text} />
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {l.from} <T v="small" color={colors.textMuted}>({cityCodes[l.from]})</T>
                </T>
                <Ionicons name="arrow-forward" size={16} color={colors.text} />
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {l.to} <T v="small" color={colors.textMuted}>({cityCodes[l.to]})</T>
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={17} color={colors.text} />
                <T v="body">{l.departDate.replace(/^\S+ /, '')} 2026</T>
              </View>
            </View>
            <View style={styles.kgBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="briefcase-outline" size={18} color={colors.text} />
                <View>
                  <T v="bodyStrong">{l.availableKg} kg</T>
                  <T v="caption" color={colors.textMuted}>
                    disponibles
                  </T>
                </View>
              </View>
              <GoldPill label={`${formatPrice(l.pricePerKg, l.currency)}/kg`} style={{ marginTop: 6, alignSelf: 'stretch', alignItems: 'center' }} />
            </View>
          </Card>

          {/* Map arc */}
          <View style={styles.map}>
            <Image source={cityImages[l.to]} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['rgba(3,15,30,0.78)', 'rgba(3,15,30,0.9)']} style={StyleSheet.absoluteFill} />
            <Svg width="100%" height="100%" viewBox="0 0 340 150" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
              <Path d="M 52 78 Q 170 -10 290 78" stroke={colors.gold} strokeWidth={1.6} strokeDasharray="6 6" fill="none" />
            </Svg>
            <View style={styles.mapPlane}>
              <Ionicons name="airplane" size={28} color={colors.goldBright} />
              <View style={styles.durationPill}>
                <T v="caption">{l.duration}</T>
              </View>
            </View>
            <Pin style={{ left: '8%' }} city={l.from} code={cityCodes[l.from]} />
            <Pin style={{ right: '8%' }} city={l.to} code={cityCodes[l.to]} />
          </View>

          {/* Flight facts */}
          <Card style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 10 }}>
            <Fact icon="airplane-outline" title="Vol" value={l.direct ? 'Direct' : 'Avec escale'} />
            <Divider vertical />
            <Fact icon="time-outline" title="Durée" value={l.duration} />
            <Divider vertical />
            <Fact icon="briefcase-outline" title="Date" value={l.departDate.replace(/^\S+ /, '')} />
          </Card>

          {/* Kilos */}
          <Card style={{ paddingVertical: 6 }}>
            <Row icon="briefcase-outline" label="Kilos disponibles" right={<T v="h3">{l.availableKg} kg</T>} />
            <Divider />
            <Row icon="cash-outline" label="Prix par kilo" right={<GoldPill label={`${formatPrice(l.pricePerKg, l.currency)}/kg`} large />} />
            <Divider />
            <View style={{ paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <T v="small" color={colors.textMuted}>
                  Remplissage de la valise
                </T>
                <T v="small" style={{ fontFamily: fonts.semibold }}>
                  {booked}/{l.totalKg} kg réservés
                </T>
              </View>
              <FlightProgress progress={booked / l.totalKg} from={cityCodes[l.from]} to={cityCodes[l.to]} />
            </View>
            <Divider />
            <View style={styles.reserve}>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => step(-1)}>
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <T v="h3" style={{ minWidth: 46, textAlign: 'center' }}>
                  {kg} kg
                </T>
                <Pressable style={styles.stepBtn} onPress={() => step(1)}>
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
              <Button
                title={`Réserver · ${formatPrice(kg * l.pricePerKg, l.currency)}`}
                variant="outline"
                small
                onPress={() => requireAuth(!!session, () => router.push({ pathname: '/payment', params: { id: l.id, kg: String(kg) } }))}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          {/* Accepted / refused */}
          <View style={[styles.items, { backgroundColor: 'rgba(61,190,122,0.06)', borderColor: 'rgba(61,190,122,0.22)' }]}>
            <View style={styles.itemsHead}>
              <View style={[styles.itemsBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <T v="h3" style={{ fontFamily: fonts.medium }}>
                Articles acceptés
              </T>
            </View>
            <View style={styles.itemsGrid}>
              {l.allowed.map((a) => (
                <Item key={a} icon={allowedIcons[a] ?? 'cube-outline'} label={a} />
              ))}
              <Item icon="ellipsis-horizontal" label="Autres non fragiles" />
            </View>
          </View>
          <View style={[styles.items, { backgroundColor: 'rgba(229,103,95,0.06)', borderColor: 'rgba(229,103,95,0.22)' }]}>
            <View style={styles.itemsHead}>
              <View style={[styles.itemsBadge, { backgroundColor: colors.danger }]}>
                <Ionicons name="close" size={16} color="#fff" />
              </View>
              <T v="h3" style={{ fontFamily: fonts.medium }}>
                Articles refusés
              </T>
            </View>
            <View style={styles.itemsGrid}>
              {l.prohibited.map((a) => (
                <Item key={a} icon={refusedIcons[a] ?? 'close-circle-outline'} label={a} />
              ))}
              <Item icon="warning-outline" label="Produits dangereux" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title={`Contacter ${first}`} leftIcon="chatbubble-outline" onPress={() => requireAuth(!!session, () => router.push('/conversation/c1'))} />
      </View>
    </View>
  );
}

function Pin({ city, code, style }: { city: string; code: string; style: object }) {
  return (
    <View style={[styles.pin, style]}>
      <Ionicons name="location-outline" size={24} color={colors.gold} />
      <T v="small" style={{ fontFamily: fonts.semibold }}>
        {city}
      </T>
      <T v="caption" color={colors.textMuted}>
        ({code})
      </T>
    </View>
  );
}

function Fact({ icon, title, value }: { icon: IconName; title: string; value: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <View style={{ flexShrink: 1 }}>
        <T v="caption" color={colors.textMuted} numberOfLines={1}>
          {title}
        </T>
        <T v="small" style={{ fontFamily: fonts.medium }} numberOfLines={1}>
          {value}
        </T>
      </View>
    </View>
  );
}

function Row({ icon, label, right }: { icon: IconName; label: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <T v="bodyStrong" style={{ flex: 1 }}>
        {label}
      </T>
      {right}
    </View>
  );
}

function Item({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={26} color={colors.text} />
      <T v="caption" style={{ textAlign: 'center' }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  skyline: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', opacity: 0.45 },
  kgBox: {
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(3,15,30,0.4)',
  },
  map: {
    height: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPlane: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center', gap: 6 },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(3,15,30,0.7)',
  },
  pin: { position: 'absolute', top: 54, alignItems: 'center' },
  reserve: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  items: { borderRadius: radius.lg, borderWidth: 1, padding: 14 },
  itemsHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemsBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 14 },
  item: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(3,15,30,0.94)' },
});
