import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading, RequestRow, Segmented } from '@/components/listing-bits';
import { ProfileChoices } from '@/components/profile-choice';
import { requireAuth } from '@/components/sign-in-prompt';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Card, SectionHeader, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { setRequestStatus, useListings, useRequests } from '@/lib/listings';
import { colors } from '@/theme';

type Tab = 'trips' | 'requests' | 'favorites';

export default function Announcements() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ created?: string }>();
  const [tab, setTab] = useState<Tab>(params.created === 'request' ? 'requests' : 'trips');

  const mine = useListings({ mine: true, limit: 100 });
  const requests = useRequests(true);
  const favorites = useListings({ favorites: true, limit: 100 });

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      mine.reload();
      requests.reload();
      favorites.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user.id]),
  );

  const choose = (key: string) =>
    requireAuth(!!session, () => router.push(key === 'sender' ? '/post-request' : '/post-listing'));

  const toggleRequest = async (id: string, status: string) => {
    await setRequestStatus(id, status === 'active' ? 'cancelled' : 'active');
    requests.reload();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before="Publier une " accent="annonce" style={{ marginTop: 36 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 250 }}>
          Proposez vos kilos libres ou trouvez un voyageur pour votre colis.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <ProfileChoices onChoose={choose} />
      </View>

      {session && (
        <View style={{ paddingHorizontal: 16, marginTop: 30, gap: 14 }}>
          <SectionHeader title="Mes annonces" />
          <Segmented
            options={[
              ['trips', `Trajets (${mine.data.length})`],
              ['requests', `Demandes (${requests.data.length})`],
              ['favorites', `Favoris (${favorites.data.length})`],
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === 'trips' &&
            (mine.loading && mine.data.length === 0 ? (
              <Loading />
            ) : mine.data.length === 0 ? (
              <EmptyState icon="airplane-outline" title="Aucun trajet publié" text="Vous voyagez bientôt ? Proposez vos kilos disponibles." />
            ) : (
              <View style={{ gap: 14 }}>
                {mine.data.map((l) => (
                  <TicketCard key={l.id} listing={l} />
                ))}
              </View>
            ))}

          {tab === 'requests' &&
            (requests.loading && requests.data.length === 0 ? (
              <Loading />
            ) : requests.data.length === 0 ? (
              <EmptyState icon="cube-outline" title="Aucune demande" text="Publiez une demande d’envoi : les voyageurs vous proposeront leurs kilos." />
            ) : (
              <Card style={{ paddingVertical: 4 }}>
                {requests.data.map((r, i) => (
                  <View key={r.id} style={[i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, r.status !== 'active' && { opacity: 0.55 }]}>
                    <RequestRow
                      r={r}
                      right={
                        <Pressable onPress={() => toggleRequest(r.id, r.status)} hitSlop={8} style={styles.reqAction}>
                          <Ionicons name={r.status === 'active' ? 'close-circle-outline' : 'refresh'} size={16} color={colors.gold} />
                          <T v="caption" color={colors.gold}>
                            {r.status === 'active' ? 'Retirer' : 'Republier'}
                          </T>
                        </Pressable>
                      }
                    />
                  </View>
                ))}
              </Card>
            ))}

          {tab === 'favorites' &&
            (favorites.loading && favorites.data.length === 0 ? (
              <Loading />
            ) : favorites.data.length === 0 ? (
              <EmptyState icon="heart-outline" title="Aucun favori" text="Touchez le cœur sur un voyage pour le retrouver ici." />
            ) : (
              <View style={{ gap: 14 }}>
                {favorites.data.map((l) => (
                  <TicketCard key={l.id} listing={l} />
                ))}
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reqAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
});
