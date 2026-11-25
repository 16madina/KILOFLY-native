import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorNote, Loading } from '@/components/listing-bits';
import { SearchCard } from '@/components/search-card';
import { requireAuth } from '@/components/sign-in-prompt';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Button, Chip, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createRouteAlert, daysBetween, toIsoDay, useListings } from '@/lib/listings';
import { colors } from '@/theme';

const filters = ['Tous', 'Cette semaine', 'Vérifiés', '10 kg et +', 'Moins cher'] as const;
type Filter = (typeof filters)[number];

export default function Search() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [from, setFrom] = useState(params.from ?? '');
  const [to, setTo] = useState(params.to ?? '');
  const [query, setQuery] = useState({ from: params.from ?? '', to: params.to ?? '' });
  const [filter, setFilter] = useState<Filter>('Tous');
  const [alert, setAlert] = useState<'idle' | 'saving' | 'saved' | string>('idle');

  // Arriving from the home search button or a popular route.
  useEffect(() => {
    setFrom(params.from ?? '');
    setTo(params.to ?? '');
    setQuery({ from: params.from ?? '', to: params.to ?? '' });
    setAlert('idle');
  }, [params.from, params.to]);

  const listings = useListings({ from: query.from, to: query.to, limit: 100 });

  const results = useMemo(() => {
    let r = listings.data;
    const today = toIsoDay(new Date());
    if (filter === 'Cette semaine') r = r.filter((l) => daysBetween(today, l.departDate) <= 7);
    if (filter === 'Vérifiés') r = r.filter((l) => l.traveler.verified);
    if (filter === '10 kg et +') r = r.filter((l) => l.remainingKg >= 10);
    if (filter === 'Moins cher') r = [...r].sort((a, b) => a.pricePerKg - b.pricePerKg);
    return r;
  }, [listings.data, filter]);

  const saveAlert = () =>
    requireAuth(!!session, async () => {
      setAlert('saving');
      const r = await createRouteAlert(session!.user.id, query.from, query.to);
      setAlert(r.error ? r.error : 'saved');
    });

  const routeLabel = query.from || query.to ? `${query.from || 'Partout'} → ${query.to || 'Partout'}` : '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 130 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before="Rechercher un " accent="voyage" style={{ marginTop: 34 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 240 }}>
          Trouvez le voyageur idéal pour votre colis.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
        <SearchCard
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
          onSearch={() => {
            setQuery({ from, to });
            setAlert('idle');
          }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16 }}>
        {listings.loading && listings.data.length === 0 ? (
          <Loading />
        ) : listings.error ? (
          <ErrorNote text={listings.error} onRetry={listings.reload} />
        ) : (
          <>
            <T v="small" color={colors.textMuted} style={{ marginBottom: 12 }}>
              {results.length} voyage{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              {routeLabel ? ` · ${routeLabel}` : ''}
            </T>
            {results.length > 0 ? (
              <View style={{ gap: 14 }}>
                {results.map((l) => (
                  <TicketCard key={l.id} listing={l} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="notifications-outline"
                title="Aucun voyage pour l’instant"
                text={
                  query.from && query.to
                    ? `Créez une alerte : on vous prévient dès qu’un voyageur publie ${query.from} → ${query.to}.`
                    : 'Indiquez un départ et une arrivée pour créer une alerte sur ce trajet.'
                }
                action={
                  query.from && query.to ? (
                    alert === 'saved' ? (
                      <T v="small" color={colors.success}>
                        Alerte créée. Vous serez prévenu(e).
                      </T>
                    ) : (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <Button title="Créer une alerte" small leftIcon="notifications-outline" onPress={saveAlert} />
                        {alert !== 'idle' && alert !== 'saving' && (
                          <T v="caption" color={colors.danger}>
                            {alert}
                          </T>
                        )}
                      </View>
                    )
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
});
