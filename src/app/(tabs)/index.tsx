import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchCard } from '@/components/search-card';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, Avatar, BrandHeader, Card, GoldPill, SectionHeader, T, tap, type IconName } from '@/components/ui';
import { cityCodes, cityImages, listings, popularRoutes, transportRequests } from '@/data/mock';
import { colors, fonts, gradients, radius } from '@/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before={'Envoyez vos colis\navec '} accent="des voyageurs" style={{ marginTop: 36 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 8, maxWidth: 260 }}>
          Un espace dans une valise, des colis qui voyagent plus loin.
        </T>
      </BrandHeader>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
        <SearchCard from={from} to={to} onFrom={setFrom} onTo={setTo} onSearch={() => router.push({ pathname: '/(tabs)/search', params: { from, to } })} />
      </View>

      {/* Available trips */}
      <View style={styles.section}>
        <SectionHeader title="Voyages disponibles" action="Voir plus" onAction={() => router.push('/(tabs)/search')} />
        <View style={{ gap: 14 }}>
          {listings.map((l) => (
            <TicketCard key={l.id} listing={l} />
          ))}
        </View>
      </View>

      {/* Popular routes */}
      <View style={styles.section}>
        <SectionHeader title="Routes populaires" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {popularRoutes.map((r) => (
          <Pressable
            key={`${r.from}-${r.to}`}
            onPress={() => {
              tap();
              setFrom(r.from);
              setTo(r.to);
            }}
            style={({ pressed }) => [styles.routeCard, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Image source={cityImages[r.to]} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={gradients.photoFade} style={StyleSheet.absoluteFill} />
            <GoldPill label={`${r.count} trajets`} style={{ backgroundColor: 'rgba(3,15,30,0.6)' }} />
            <View>
              <T v="caption" color={colors.gold} style={{ letterSpacing: 1 }}>
                {cityCodes[r.from]} → {cityCodes[r.to]}
              </T>
              <T v="h2">{r.to}</T>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Transport requests */}
      <View style={styles.section}>
        <SectionHeader title="Ils cherchent un voyageur" />
        <Card style={{ paddingVertical: 4 }}>
          {transportRequests.map((r, i) => (
            <View key={r.id} style={[styles.request, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Avatar initials={r.initials} size={42} />
              <View style={{ flex: 1 }}>
                <T v="bodyStrong" numberOfLines={1}>
                  {r.item}
                </T>
                <T v="caption" color={colors.textMuted}>
                  {r.from} → {r.to} · {r.kg} kg · {r.when}
                </T>
              </View>
              <GoldPill label={r.budget} />
            </View>
          ))}
        </Card>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <SectionHeader title="Comment ça marche" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(
            [
              ['search', 'Trouvez un voyageur'],
              ['shield-checkmark-outline', 'Payez en sécurité'],
              ['airplane-outline', 'Suivez votre colis'],
            ] as [IconName, string][]
          ).map(([icon, text]) => (
            <Card key={text} style={styles.how}>
              <View style={styles.howIcon}>
                <Ionicons name={icon} size={22} color={colors.gold} />
              </View>
              <T v="small" style={{ textAlign: 'center' }}>
                {text}
              </T>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 30 },
  routeCard: {
    width: 140,
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  request: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  how: { flex: 1, alignItems: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 8 },
  howIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
