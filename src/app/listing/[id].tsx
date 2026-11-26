import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { EmptyState, Loading } from '@/components/listing-bits';
import { requireAuth } from '@/components/sign-in-prompt';
import {
  Avatar,
  BackButton,
  BrandHeader,
  Button,
  Card,
  Divider,
  FlightProgress,
  GoldPill,
  IconButton,
  Stars,
  T,
  tap,
  VerifiedBadge,
  type IconName,
} from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { cityCode, cityImage, countryOf } from '@/lib/cities';
import { daysBetween, DELIVERY_OPTIONS, longDate, money, setFavorite, setListingStatus, shortDate, useListing } from '@/lib/listings';
import { memberSince } from '@/lib/use-my-stats';
import { useApprox } from '@/lib/currency';
import { startConversation } from '@/lib/messages';
import { colors, fonts, radius } from '@/theme';

const ICONS: [RegExp, IconName][] = [
  [/v[êe]tement|tissu/i, 'shirt-outline'],
  [/document|papier/i, 'document-text-outline'],
  [/cosm|parfum/i, 'color-palette-outline'],
  [/[ée]lectron|t[ée]l[ée]phone|ordinateur/i, 'phone-portrait-outline'],
  [/chaussure/i, 'footsteps-outline'],
  [/livre/i, 'book-outline'],
  [/[ée]pice|nourriture|aliment/i, 'leaf-outline'],
  [/artisanat|cadeau/i, 'gift-outline'],
  [/m[ée]dicament/i, 'medkit-outline'],
  [/liquide/i, 'wine-outline'],
  [/fra[iî]che|congel/i, 'snow-outline'],
  [/batterie/i, 'battery-dead-outline'],
  [/dangereu|inflammable|arme/i, 'warning-outline'],
];
const iconFor = (item: string, fallback: IconName): IconName => ICONS.find(([re]) => re.test(item))?.[1] ?? fallback;

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const approx = useApprox();
  const { session } = useAuth();
  const { data: l, setData, loading, reload } = useListing(id);
  const [kg, setKg] = useState(1);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (l) setKg(Math.max(1, Math.min(3, l.remainingKg)));
  }, [l]);

  if (loading && !l) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  }
  if (!l) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 20, paddingHorizontal: 16, gap: 16 }}>
        <BackButton />
        <EmptyState icon="airplane-outline" title="Annonce introuvable" text="Ce voyage n’existe plus ou n’est plus disponible." />
      </View>
    );
  }

  const isMine = session?.user.id === l.userId;
  const booked = Math.max(0, l.totalKg - l.remainingKg);
  const first = l.traveler.name.split(' ')[0];
  const parts = l.traveler.name.split(' ').filter(Boolean);
  const nameShort = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : l.traveler.name;
  const days = daysBetween(l.departDate, l.arriveDate);
  const duration = days <= 0 ? 'Même jour' : `${days} jour${days > 1 ? 's' : ''}`;
  const delivery = DELIVERY_OPTIONS[l.deliveryOption] ?? DELIVERY_OPTIONS.pickup;

  const step = (d: number) => {
    tap();
    setKg((k) => Math.max(1, Math.min(l.remainingKg, k + d)));
  };

  const toggleFav = () =>
    requireAuth(!!session, async () => {
      const on = !l.isFavorite;
      setData({ ...l, isFavorite: on });
      const r = await setFavorite(session!.user.id, l.id, on);
      if (r.error) setData({ ...l, isFavorite: !on });
    });

  const changeStatus = async (status: 'active' | 'cancelled') => {
    setBusy(true);
    const r = await setListingStatus(l.id, status);
    setBusy(false);
    if (r.error) return setNote(r.error);
    reload();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <BrandHeader top={insets.top} right={<IconButton icon={l.isFavorite ? 'heart' : 'heart-outline'} onPress={toggleFav} />}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
            <BackButton />
            <T v="title">Détail du voyage</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Ionicons name={l.traveler.verified ? 'shield-checkmark-outline' : 'briefcase-outline'} size={18} color={colors.gold} />
            <T v="body" color={colors.gold}>
              {isMine ? 'Votre annonce' : l.traveler.verified ? 'Offre de voyageur vérifié' : 'Offre de voyageur'}
            </T>
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 14 }}>
          {/* Traveler */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: l.userId } })}>
            <Image source={cityImage(l.to)} style={styles.skyline} contentFit="cover" />
            <LinearGradient colors={['#111E2E', 'rgba(17,30,46,0.5)']} start={{ x: 0.35, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Avatar photo={l.traveler.avatar ? { uri: l.traveler.avatar } : undefined} initials={initialsOf(l.traveler.name)} size={78} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T v="h2" style={{ fontSize: 23, flexShrink: 1 }} numberOfLines={1}>
                  {nameShort}
                </T>
                {l.traveler.verified && <VerifiedBadge size={20} />}
              </View>
              {l.traveler.rating !== null ? (
                <Stars rating={l.traveler.rating} reviews={l.traveler.reviews} size="large" />
              ) : (
                <T v="small" color={colors.textMuted}>
                  Nouveau voyageur
                </T>
              )}
              <Divider style={{ marginVertical: 4 }} />
              <T v="small" color={colors.textMuted}>
                Membre depuis {memberSince(l.traveler.since ?? undefined)}
                {l.traveler.trips ? ` · ${l.traveler.trips} voyages` : ''}
              </T>
            </View>
          </Card>

          {/* Route */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Ionicons name="airplane" size={18} color={colors.text} />
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {l.from} <T v="small" color={colors.textMuted}>({cityCode(l.from)})</T>
                </T>
                <Ionicons name="arrow-forward" size={16} color={colors.text} />
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {l.to} <T v="small" color={colors.textMuted}>({cityCode(l.to)})</T>
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={17} color={colors.text} />
                <T v="body">{longDate(l.departDate)}</T>
              </View>
            </View>
            <View style={styles.kgBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="briefcase-outline" size={18} color={colors.text} />
                <View>
                  <T v="bodyStrong">{l.remainingKg} kg</T>
                  <T v="caption" color={colors.textMuted}>
                    disponibles
                  </T>
                </View>
              </View>
              <GoldPill label={`${money(l.pricePerKg, l.currency)}/kg`} style={{ marginTop: 6, alignSelf: 'stretch', alignItems: 'center' }} />
            </View>
          </Card>

          {/* Map arc */}
          <View style={styles.map}>
            <Image source={cityImage(l.to)} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['rgba(3,15,30,0.78)', 'rgba(3,15,30,0.9)']} style={StyleSheet.absoluteFill} />
            <Svg width="100%" height="100%" viewBox="0 0 340 150" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
              <Path d="M 52 78 Q 170 -10 290 78" stroke={colors.gold} strokeWidth={1.6} strokeDasharray="6 6" fill="none" />
            </Svg>
            <View style={styles.mapPlane}>
              <Ionicons name="airplane" size={28} color={colors.goldBright} />
              <View style={styles.durationPill}>
                <T v="caption">{duration}</T>
              </View>
            </View>
            <Pin style={{ left: '8%' }} city={l.from} code={cityCode(l.from)} />
            <Pin style={{ right: '8%' }} city={l.to} code={cityCode(l.to)} />
          </View>

          {/* Facts */}
          <Card style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 10 }}>
            <Fact icon="airplane-outline" title="Départ" value={shortDate(l.departDate)} />
            <Divider vertical />
            <Fact icon="flag-outline" title="Arrivée" value={shortDate(l.arriveDate)} />
            <Divider vertical />
            <Fact icon="globe-outline" title="Pays" value={countryOf(l.to) || '—'} />
          </Card>

          {/* Kilos */}
          <Card style={{ paddingVertical: 6 }}>
            <Row icon="briefcase-outline" label="Kilos disponibles" right={<T v="h3">{l.remainingKg} kg</T>} />
            <Divider />
            <Row icon="cash-outline" label="Prix par kilo" right={<GoldPill label={`${money(l.pricePerKg, l.currency)}/kg`} large />} />
            {approx(l.pricePerKg, l.currency) && (
              <T v="caption" color={colors.textMuted} style={{ marginTop: -6, marginBottom: 10, textAlign: 'right' }}>
                {approx(l.pricePerKg, l.currency)}/kg dans votre devise
              </T>
            )}
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
              <FlightProgress progress={l.totalKg ? booked / l.totalKg : 0} from={cityCode(l.from)} to={cityCode(l.to)} />
            </View>
            <Divider />
            <Row icon="swap-horizontal-outline" label={delivery.label} right={null} />
            <T v="caption" color={colors.textMuted} style={{ marginTop: -6, marginBottom: 10, marginLeft: 34 }}>
              {delivery.description}
            </T>
            {!isMine && l.remainingKg > 0 && (
              <>
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
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <T v="bodyStrong" color={colors.goldBright}>
                      {money(kg * l.pricePerKg, l.currency)}
                    </T>
                    {approx(kg * l.pricePerKg, l.currency) && (
                      <T v="caption" color={colors.textMuted}>
                        {approx(kg * l.pricePerKg, l.currency)}
                      </T>
                    )}
                  </View>
                </View>
              </>
            )}
          </Card>

          {l.description ? (
            <Card style={{ flexDirection: 'row', gap: 12 }}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.gold} />
              <T v="body" style={{ flex: 1 }}>
                {l.description}
              </T>
            </Card>
          ) : null}

          {/* Accepted / refused */}
          {l.allowed.length > 0 && (
            <View style={[styles.items, { backgroundColor: 'rgba(61,190,122,0.06)', borderColor: 'rgba(61,190,122,0.22)' }]}>
              <ItemsHead ok title="Articles acceptés" />
              <View style={styles.itemsGrid}>
                {l.allowed.map((a) => (
                  <Item key={a} icon={iconFor(a, 'cube-outline')} label={a} />
                ))}
              </View>
            </View>
          )}
          {l.prohibited.length > 0 && (
            <View style={[styles.items, { backgroundColor: 'rgba(229,103,95,0.06)', borderColor: 'rgba(229,103,95,0.22)' }]}>
              <ItemsHead title="Articles refusés" />
              <View style={styles.itemsGrid}>
                {l.prohibited.map((a) => (
                  <Item key={a} icon={iconFor(a, 'close-circle-outline')} label={a} />
                ))}
              </View>
            </View>
          )}

          {note && (
            <T v="small" color={colors.gold} style={{ textAlign: 'center' }}>
              {note}
            </T>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
        ) : isMine ? (
          l.status === 'active' ? (
            <Button title="Annuler mon annonce" variant="outline" leftIcon="close-circle-outline" onPress={() => changeStatus('cancelled')} />
          ) : (
            <Button title="Réactiver mon annonce" leftIcon="refresh" onPress={() => changeStatus('active')} />
          )
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="Contacter"
              variant="dark"
              leftIcon="chatbubble-outline"
              onPress={() =>
                requireAuth(!!session, async () => {
                  const r = await startConversation(l.id);
                  if (r.id) router.push({ pathname: '/conversation/[id]', params: { id: r.id } });
                  else setNote(r.error ?? 'Impossible d’ouvrir la discussion.');
                })
              }
              style={{ flex: 1 }}
            />
            {l.status === 'active' && l.remainingKg > 0 ? (
              <Button
                title={`Réserver ${kg} kg`}
                icon="arrow-forward"
                onPress={() => requireAuth(!!session, () => router.push({ pathname: '/reserve/[id]', params: { id: l.id, kg: String(kg) } }))}
                style={{ flex: 1.4 }}
              />
            ) : (
              <Button title="Complet" variant="dark" style={{ flex: 1.4, opacity: 0.6 }} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function ItemsHead({ ok, title }: { ok?: boolean; title: string }) {
  return (
    <View style={styles.itemsHead}>
      <View style={[styles.itemsBadge, { backgroundColor: ok ? colors.success : colors.danger }]}>
        <Ionicons name={ok ? 'checkmark' : 'close'} size={16} color="#fff" />
      </View>
      <T v="h3" style={{ fontFamily: fonts.medium }}>
        {title}
      </T>
    </View>
  );
}

function Pin({ city, code, style }: { city: string; code: string; style: object }) {
  return (
    <View style={[styles.pin, style]}>
      <Ionicons name="location-outline" size={24} color={colors.gold} />
      <T v="small" style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
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
      <Ionicons name={icon} size={22} color={colors.text} />
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
  map: { height: 150, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  mapPlane: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center', gap: 6 },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(3,15,30,0.7)',
  },
  pin: { position: 'absolute', top: 54, alignItems: 'center', maxWidth: 110 },
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
