import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorNote, Loading } from '@/components/listing-bits';
import { RequestTicket } from '@/components/listing-bits';
import { type SearchMode } from '@/components/search-card';
import { router } from 'expo-router';
import { requireAuth } from '@/components/sign-in-prompt';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Button, Chip, T, tap } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createRouteAlert, daysBetween, toIsoDay, useListings, useRequests } from '@/lib/listings';
import { colors, fonts } from '@/theme';

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
  const [text, setText] = useState('');
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

  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const listings = useListings({ from: query.from, to: query.to, limit: 200 });

  const results = useMemo(() => {
    let r = listings.data;
    if (text.trim()) r = r.filter((l) => norm(`${l.from} ${l.to}`).includes(norm(text)));
    const today = toIsoDay(new Date());
    if (range.start) r = r.filter((l) => l.departDate >= range.start!);
    if (range.end) r = r.filter((l) => l.departDate <= range.end!);
    if (filter === 'Cette semaine') r = r.filter((l) => daysBetween(today, l.departDate) <= 7);
    if (filter === 'Vérifiés') r = r.filter((l) => l.traveler.verified);
    if (filter === '10 kg et +') r = r.filter((l) => l.remainingKg >= 10);
    if (filter === 'Moins cher') r = [...r].sort((a, b) => a.pricePerKg - b.pricePerKg);
    return r;
  }, [listings.data, filter, range, text]);

  const requests = useRequests(false);
  const requestResults = useMemo(() => {
    let r = requests.data.filter((q) => q.status === 'active');
    if (text.trim()) r = r.filter((q) => norm(`${q.from} ${q.to}`).includes(norm(text)));
    if (query.from) r = r.filter((q) => norm(q.from).includes(norm(query.from)));
    if (query.to) r = r.filter((q) => norm(q.to).includes(norm(query.to)));
    // The sender's window [dateStart, dateEnd] must overlap the searched dates.
    if (range.start) r = r.filter((q) => (q.dateEnd ?? q.dateStart) >= range.start!);
    if (range.end) r = r.filter((q) => q.dateStart <= range.end!);
    return r;
  }, [requests.data, query, range, text]);

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
      <BrandHeader top={insets.top} art={false}>
        <AccentTitle before="Les " accent="annonces" style={{ marginTop: 26 }} />
      </BrandHeader>

      {/* Two tabs: people who travel / people who want to send a parcel. */}
      <View style={styles.modeTabs}>
        {(
          [
            ['trips', 'airplane', 'Voyageurs'],
            ['requests', 'cube-outline', 'Expéditeurs'],
          ] as const
        ).map(([m, icon, title]) => {
          const active = mode === m;
          return (
            <Pressable key={m} onPress={() => (tap(), setMode(m))} style={[styles.modeTab, active && styles.modeTabActive]}>
              <Ionicons name={icon} size={18} color={active ? colors.bg : colors.gold} />
              <T v="bodyStrong" color={active ? colors.bg : colors.text}>
                {title}
              </T>
            </Pressable>
          );
        })}
      </View>

      {/* Small search bar: a city or a country, matched on departure or arrival. */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={mode === 'trips' ? 'Rechercher une ville, un pays…' : 'Rechercher une ville, un pays…'}
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!(text || routeLabel) && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setText('');
              setQuery({ from: '', to: '' });
              setRange({ start: null, end: null });
            }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
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
                <View style={{ gap: 14 }}>
                  {requestResults.map((r) => (
                    <RequestTicket key={r.id} r={r} onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="cube-outline"
                  title="Aucune demande"
                  text={text || routeLabel ? 'Aucun expéditeur ne cherche de voyageur pour cette recherche.' : 'Aucun expéditeur ne cherche de voyageur pour le moment.'}
                  action={<Button title="Publier une demande" small leftIcon="add" onPress={() => router.push('/post-request')} />}
                />
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
                      <T v="small" color={colors.success} onPress={() => router.push('/alerts')}>
                        Alerte créée. Vous serez prévenu(e). Gérer mes alertes ›
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
  modeTabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  modeTabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filters: { gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
});
