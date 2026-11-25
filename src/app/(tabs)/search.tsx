import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchCard } from '@/components/search-card';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, Chip, T } from '@/components/ui';
import { listings } from '@/data/mock';
import { colors, radius } from '@/theme';

const filters = ['Tous', 'Vérifiés', '10 kg et +', 'Moins cher', 'Vol direct'] as const;
type Filter = (typeof filters)[number];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

export default function Search() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [from, setFrom] = useState(params.from ?? '');
  const [to, setTo] = useState(params.to ?? '');
  const [query, setQuery] = useState({ from: params.from ?? '', to: params.to ?? '' });
  const [filter, setFilter] = useState<Filter>('Tous');

  // Arriving from the home search button
  useEffect(() => {
    setFrom(params.from ?? '');
    setTo(params.to ?? '');
    setQuery({ from: params.from ?? '', to: params.to ?? '' });
  }, [params.from, params.to]);

  const results = useMemo(() => {
    let r = listings.filter(
      (l) =>
        (!query.from || norm(l.from).includes(norm(query.from))) && (!query.to || norm(l.to).includes(norm(query.to))),
    );
    if (filter === 'Vérifiés') r = r.filter((l) => l.traveler.verified);
    if (filter === '10 kg et +') r = r.filter((l) => l.availableKg >= 10);
    if (filter === 'Vol direct') r = r.filter((l) => l.direct);
    if (filter === 'Moins cher') r = [...r].sort((a, b) => a.pricePerKg - b.pricePerKg);
    return r;
  }, [query, filter]);

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
        <SearchCard from={from} to={to} onFrom={setFrom} onTo={setTo} onSearch={() => setQuery({ from, to })} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16 }}>
        <T v="small" color={colors.textMuted} style={{ marginBottom: 12 }}>
          {results.length} voyage{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          {query.from || query.to ? ` · ${query.from || 'Partout'} → ${query.to || 'Partout'}` : ''}
        </T>

        {results.length > 0 ? (
          <View style={{ gap: 14 }}>
            {results.map((l) => (
              <TicketCard key={l.id} listing={l} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="airplane-outline" size={34} color={colors.gold} />
            <T v="h2" style={{ textAlign: 'center' }}>
              Aucun voyage pour l’instant
            </T>
            <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
              Créez une alerte : on vous prévient dès qu’un voyageur publie ce trajet.
            </T>
            <Chip label="Créer une alerte" icon="notifications-outline" active onPress={() => {}} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
  empty: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
});
