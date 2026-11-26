import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorNote, Loading } from '@/components/listing-bits';
import { RequestRow } from '@/components/listing-bits';
import { SearchCard, type SearchMode } from '@/components/search-card';
import { router } from 'expo-router';
import { requireAuth } from '@/components/sign-in-prompt';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Button, Chip, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createRouteAlert, daysBetween, toIsoDay, useListings, useRequests } from '@/lib/listings';
import { colors } from '@/theme';

const filters = ['Tous', 'Cette semaine', 'Vérifiés', '10 kg et +', 'Moins cher'] as const;
type Filter = (typeof filters)[number];

export default function Search() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ from?: string; to?: string; mode?: SearchMode; start?: string; end?: string }>();
  const [mode, setMode] = useState<SearchMode>(params.mode === 'requests' ? 'requests' : 'trips');
  const [start, setStart] = useState<string | null>(params.start || null);
  const [end, setEnd] = useState<string | null>(params.end || null);
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: params.start || null, end: params.end || null });
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
    if (params.mode) setMode(params.mode === 'requests' ? 'requests' : 'trips');
    setStart(params.start || null);
    setEnd(params.end || null);
    setRange({ start: params.start || null, end: params.end || null });
    setAlert('idle');
  }, [params.from, params.to, params.mode, params.start, params.end]);

  const listings = useListings({ from: query.from, to: query.to, limit: 100 });

  const results = useMemo(() => {
    let r = listings.data;
    const today = toIsoDay(new Date());
    if (range.start) r = r.filter((l) => l.departDate >= range.start!);
    if (range.end) r = r.filter((l) => l.departDate <= range.end!);
    if (filter === 'Cette semaine') r = r.filter((l) => daysBetween(today, l.departDate) <= 7);
    if (filter === 'Vérifiés') r = r.filter((l) => l.traveler.verified);
    if (filter === '10 kg et +') r = r.filter((l) => l.remainingKg >= 10);
    if (filter === 'Moins cher') r = [...r].sort((a, b) => a.pricePerKg - b.pricePerKg);
    return r;
  }, [listings.data, filter, range]);

  const requests = useRequests(false);
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const requestResults = useMemo(() => {
    let r = requests.data.filter((q) => q.status === 'active');
    if (query.from) r = r.filter((q) => norm(q.from).includes(norm(query.from)));
    if (query.to) r = r.filter((q) => norm(q.to).includes(norm(query.to)));
    // The sender's window [dateStart, dateEnd] must overlap the searched dates.
    if (range.start) r = r.filter((q) => (q.dateEnd ?? q.dateStart) >= range.start!);
    if (range.end) r = r.filter((q) => q.dateStart <= range.end!);
    return r;
  }, [requests.data, query, range]);

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
        <AccentTitle before="Rechercher " accent={mode === 'trips' ? 'un voyage' : 'des colis'} style={{ marginTop: 34 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 240 }}>
          {mode === 'trips' ? 'Trouvez le voyageur idéal pour votre colis.' : 'Voyageurs : trouvez des colis à transporter sur votre trajet.'}
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
        <SearchCard
          mode={mode}
          onMode={setMode}
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
          start={start}
          end={end}
          onDates={(a, b) => (setStart(a), setEnd(b))}
          onSearch={() => {
            setQuery({ from, to });
            setRange({ start, end });
            setAlert('idle');
          }}
        />
      </View>

      {mode === 'requests' ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
          {!session ? (
            <EmptyState icon="lock-closed-outline" title="Connectez-vous" text="Les demandes de colis sont visibles une fois connecté." />
          ) : requests.loading && requests.data.length === 0 ? (
            <Loading />
          ) : (
            <>
              <T v="small" color={colors.textMuted} style={{ marginBottom: 12 }}>
                {requestResults.length} demande{requestResults.length > 1 ? 's' : ''} de colis{routeLabel ? ` · ${routeLabel}` : ''}
              </T>
              {requestResults.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {requestResults.map((r) => (
                    <RequestRow key={r.id} r={r} onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })} />
                  ))}
                </View>
              ) : (
                <EmptyState icon="cube-outline" title="Aucune demande" text="Aucun expéditeur ne cherche encore de voyageur sur ce trajet à ces dates." />
              )}
            </>
          )}
        </View>
      ) : (
        <>
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
});
