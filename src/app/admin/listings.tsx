import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminScreen, Badge, confirm, Empty, ErrorBox, notify, SearchField, SmallAction } from '@/components/admin-ui';
import { Card, Chip, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { listListings, money, setListingStatus, shortDate, type AdminListing } from '@/lib/admin';
import { colors } from '@/theme';

const filters = [
  { key: '', label: 'Toutes' },
  { key: 'active', label: 'Actives' },
  { key: 'cancelled', label: 'Suspendues / annulées' },
  { key: 'completed', label: 'Terminées' },
];

const statusBadge: Record<string, { label: string; tone: 'success' | 'danger' | 'muted' }> = {
  active: { label: 'Active', tone: 'success' },
  cancelled: { label: 'Suspendue / annulée', tone: 'danger' },
  completed: { label: 'Terminée', tone: 'muted' },
};

export default function AdminListings() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<AdminListing[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (q: string, s: string) => {
    setError('');
    try {
      setItems(await listListings(q.trim(), s));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => load(search, status), 300);
    return () => clearTimeout(t);
  }, [isAdmin, search, status, load]);

  async function toggle(l: AdminListing) {
    const suspend = l.status === 'active';
    const ok = await confirm(
      suspend ? "Suspendre l'annonce ?" : "Réactiver l'annonce ?",
      `${l.departure} → ${l.arrival} (${l.owner_name || 'voyageur'}). ${suspend ? "Elle n'apparaîtra plus dans la recherche." : 'Elle réapparaîtra dans la recherche.'}`,
    );
    if (!ok) return;
    try {
      await setListingStatus(l.id, suspend ? 'cancelled' : 'active', suspend ? 'Suspendue par un admin' : undefined);
      await load(search, status);
    } catch (e) {
      const msg = (e as Error).message;
      notify(msg.includes('owner is banned') ? 'Le propriétaire est suspendu : réactivez son compte d’abord.' : msg);
    }
  }

  return (
    <AdminScreen title="Annonces" onRefresh={() => load(search, status)}>
      <SearchField value={search} onChange={setSearch} placeholder="Ville ou nom du voyageur" />
      <View style={styles.chips}>
        {filters.map((f) => (
          <Chip key={f.key} label={f.label} active={status === f.key} onPress={() => setStatus(f.key)} />
        ))}
      </View>
      {!!error && <ErrorBox text={error} />}
      {items?.length === 0 && <Empty icon="airplane-outline" text="Aucune annonce." />}
      {items?.map((l) => {
        const b = statusBadge[l.status] ?? { label: l.status, tone: 'muted' as const };
        const past = new Date(l.departure_date) < new Date(new Date().toDateString());
        return (
          <Card key={l.id} style={{ gap: 8 }} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: l.id } })}>
            <View style={styles.head}>
              <T v="h3" style={{ flex: 1 }} numberOfLines={1}>
                {l.departure} → {l.arrival}
              </T>
              <Badge label={b.label} tone={b.tone} />
            </View>
            <T v="small" color={colors.textMuted}>
              {l.owner_name || 'Voyageur'} · départ le {shortDate(l.departure_date)}
              {past ? ' (passé)' : ''}
            </T>
            <View style={styles.head}>
              <T v="caption" color={colors.textFaint} style={{ flex: 1 }}>
                {Number(l.available_kg)} kg · {money(l.price_per_kg, l.currency)}/kg · {l.reservations_count} réservation
                {l.reservations_count > 1 ? 's' : ''}
              </T>
              {(l.status === 'active' || l.status === 'cancelled') && (
                <SmallAction
                  label={l.status === 'active' ? 'Suspendre' : 'Réactiver'}
                  icon={l.status === 'active' ? 'pause' : 'play'}
                  tone={l.status === 'active' ? 'danger' : 'gold'}
                  onPress={() => toggle(l)}
                />
              )}
            </View>
          </Card>
        );
      })}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
