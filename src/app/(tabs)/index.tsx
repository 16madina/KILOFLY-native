import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorNote, Loading, RequestRow } from '@/components/listing-bits';
import { SearchCard } from '@/components/search-card';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Button, Card, SectionHeader, T, tap, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cityCode, cityImage, POPULAR_ROUTES } from '@/lib/cities';
import { useListings, useRequests } from '@/lib/listings';
import { colors, gradients, radius } from '@/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const listings = useListings({ limit: 6 });
  const requests = useRequests(false);

  // Refresh when coming back to the tab (e.g. after publishing).
  useFocusEffect(
    useCallback(() => {
      listings.reload();
      requests.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const search = (f = from, t = to) => router.push({ pathname: '/(tabs)/search', params: { from: f, to: t } });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          tintColor={colors.gold}
          onRefresh={() => {
            listings.reload();
            requests.reload();
          }}
        />
      }>
      <BrandHeader top={insets.top}>
        <AccentTitle before={'Envoyez vos colis\navec '} accent="des voyageurs" style={{ marginTop: 36 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 8, maxWidth: 260 }}>
          Un espace dans une valise, des colis qui voyagent plus loin.
        </T>
      </BrandHeader>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
        <SearchCard from={from} to={to} onFrom={setFrom} onTo={setTo} onSearch={() => search()} />
      </View>

      {/* Available trips */}
      <View style={styles.section}>
        <SectionHeader title="Voyages disponibles" action="Voir plus" onAction={() => router.push('/(tabs)/search')} />
        {listings.loading && listings.data.length === 0 ? (
          <Loading />
        ) : listings.error ? (
          <ErrorNote text={listings.error} onRetry={listings.reload} />
        ) : listings.data.length === 0 ? (
          <EmptyState
            icon="airplane-outline"
            title="Aucun voyage pour l’instant"
            text="Vous partez bientôt ? Publiez votre trajet et rentabilisez vos kilos libres."
            action={<Button title="Proposer un voyage" small icon="arrow-forward" onPress={() => router.push('/post-listing')} />}
          />
        ) : (
          <View style={{ gap: 14 }}>
            {listings.data.map((l) => (
              <TicketCard key={l.id} listing={l} />
            ))}
          </View>
        )}
      </View>

      {/* Popular routes: shortcuts into the search */}
      <View style={styles.section}>
        <SectionHeader title="Routes populaires" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {POPULAR_ROUTES.map(([f, t]) => (
          <Pressable
            key={`${f}-${t}`}
            onPress={() => {
              tap();
              search(f, t);
            }}
            style={({ pressed }) => [styles.routeCard, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Image source={cityImage(t)} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={gradients.photoFade} style={StyleSheet.absoluteFill} />
            <View style={styles.routeGo}>
              <Ionicons name="search" size={14} color={colors.onGold} />
            </View>
            <View>
              <T v="caption" color={colors.gold} style={{ letterSpacing: 1 }}>
                {cityCode(f)} → {cityCode(t)}
              </T>
              <T v="h2">{t}</T>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Shipping requests (signed-in users only, as in the database rules) */}
      {session && (
        <View style={styles.section}>
          <SectionHeader title="Ils cherchent un voyageur" action="Publier" onAction={() => router.push('/post-request')} />
          {requests.loading && requests.data.length === 0 ? (
            <Loading />
          ) : requests.data.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="Aucune demande en cours"
              text="Vous avez un colis à envoyer ? Publiez une demande, les voyageurs vous contacteront."
            />
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {requests.data.slice(0, 5).map((r, i) => (
                <View key={r.id} style={i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }}>
                  <RequestRow r={r} onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })} />
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

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
  routeGo: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
