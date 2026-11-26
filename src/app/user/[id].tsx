// Public profile: identity badge, stats, reviews, and the person's upcoming trips.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, notify } from '@/components/admin-ui';
import { StarRow } from '@/components/review-card';
import { TicketCard } from '@/components/ticket-card';
import { Avatar, BackButton, BrandHeader, Button, Card, T, VerifiedBadge, type IconName } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { useListings } from '@/lib/listings';
import { blockUser } from '@/lib/messages';
import { usePublicProfile } from '@/lib/reviews';
import { colors, fonts } from '@/theme';

const TYPE: Record<string, string> = { traveler: 'Voyageur', shipper: 'Expéditeur', professional: 'Professionnel' };

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile: p, reviews, reload } = usePublicProfile(id);
  const listings = useListings({ limit: 100 });
  const trips = listings.data.filter((l) => l.userId === id && l.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 }}>
          <BackButton />
          <T v="title">Profil</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
        {p === undefined ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : p === null ? (
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 40 }}>
            Ce profil n’est pas disponible.
          </T>
        ) : (
          <>
            <Card gold style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
              <Avatar photo={p.avatar_url ? { uri: p.avatar_url } : undefined} initials={initialsOf(p.full_name ?? '?')} size={96} ring verified={p.id_verified} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="title" style={{ fontSize: 24 }}>
                  {p.full_name ?? 'Utilisateur'}
                </T>
                {p.id_verified && <VerifiedBadge size={20} />}
              </View>
              <T v="small" color={colors.textMuted}>
                {[TYPE[p.user_type ?? ''], [p.city, p.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
              </T>
              {p.rating !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <StarRow value={p.rating} size={18} />
                  <T v="bodyStrong">{p.rating.toFixed(1).replace('.', ',')}</T>
                  <T v="small" color={colors.textMuted}>
                    ({p.reviews} avis)
                  </T>
                </View>
              ) : (
                <T v="small" color={colors.textMuted}>
                  Pas encore d’avis
                </T>
              )}
              <View style={[styles.badge, p.id_verified && { borderColor: colors.borderGold }]}>
                <Ionicons name={p.id_verified ? 'shield-checkmark' : 'shield-outline'} size={14} color={p.id_verified ? colors.gold : colors.textMuted} />
                <T v="caption" color={p.id_verified ? colors.goldBright : colors.textMuted}>
                  {p.id_verified ? 'Identité vérifiée par KiloFly' : 'Identité non vérifiée'}
                </T>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Stat icon="airplane" value={p.completed_trips} label="Livraisons" />
              <Stat icon="cube-outline" value={p.shipments} label="Envois" />
              <Stat icon="calendar-outline" value={new Date(p.member_since).getFullYear()} label="Membre depuis" />
            </View>

            {!!p.bio && (
              <Card>
                <T v="caption" color={colors.textMuted} style={{ marginBottom: 4 }}>
                  À propos
                </T>
                <T v="body">{p.bio}</T>
              </Card>
            )}

            {trips.length > 0 && (
              <>
                <T v="h2">Prochains voyages</T>
                <View style={{ gap: 12 }}>
                  {trips.map((l) => (
                    <TicketCard key={l.id} listing={l} />
                  ))}
                </View>
              </>
            )}

            <T v="h2">Avis ({reviews.length})</T>
            {reviews.length === 0 ? (
              <T v="small" color={colors.textMuted}>
                Les avis apparaissent après une livraison terminée.
              </T>
            ) : (
              reviews.map((r) => (
                <Card key={r.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar photo={r.reviewer_avatar ? { uri: r.reviewer_avatar } : undefined} initials={initialsOf(r.reviewer_name ?? '?')} size={36} />
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong">{r.reviewer_name ?? 'Utilisateur'}</T>
                      <T v="caption" color={colors.textMuted}>
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        {r.route ? ` · ${r.route}` : ''}
                      </T>
                    </View>
                    <StarRow value={r.rating} />
                  </View>
                  {!!r.comment && <T v="small">{r.comment}</T>}
                </Card>
              ))
            )}

            {session && !p.is_me && (
              <Button
                title={p.blocked_by_me ? 'Débloquer' : 'Bloquer cet utilisateur'}
                small
                variant="dark"
                leftIcon="ban-outline"
                style={{ marginTop: 8 }}
                onPress={async () => {
                  const ok = await confirm(
                    p.blocked_by_me ? 'Débloquer ?' : 'Bloquer ?',
                    p.blocked_by_me ? 'Vous pourrez de nouveau échanger.' : 'Vous ne pourrez plus vous écrire.',
                  );
                  if (!ok) return;
                  const r = await blockUser(p.id, !p.blocked_by_me);
                  if (r.error) notify(r.error);
                  reload();
                }}
              />
            )}
            {p.is_me && (
              <Button title="Modifier mon profil" small variant="outline" leftIcon="create-outline" onPress={() => router.push('/edit-profile')} />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14 }}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <T v="h2" style={{ fontFamily: fonts.serifBold }}>
        {value}
      </T>
      <T v="caption" color={colors.textMuted}>
        {label}
      </T>
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
});
