import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading } from '@/components/listing-bits';
import { StatusPill } from '@/components/reservation-card';
import { Avatar, BackButton, BrandHeader, Button, Card, Divider, FlightProgress, T, VerifiedBadge } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { cityCode } from '@/lib/cities';
import { longDate, money } from '@/lib/listings';
import { cancelReservation, respondReservation, useReservation, type Reservation } from '@/lib/reservations';
import { DeliveryCodeCard, TrackingTimeline } from '@/components/tracking-timeline';
import { reachedStep, TRAVELER_STEPS, useTracking } from '@/lib/tracking';
import { colors } from '@/theme';

const STEPS = ['Demande envoyée', 'Acceptée par le voyageur', 'Paiement sécurisé', 'Livré'];
const stepIndex = (r: Reservation) =>
  r.status === 'pending' ? 0 : r.status === 'approved' ? 1 : r.status === 'in_progress' ? 2 : r.status === 'delivered' ? 3 : -1;

export default function ReservationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const { data: r, loading, reload } = useReservation(id);
  const tracking = useTracking(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
      tracking.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload]),
  );

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href={{ pathname: '/auth', params: { mode: 'login' } }} />;
  if (loading && !r) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  }
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 20, paddingHorizontal: 16, gap: 16 }}>
        <BackButton />
        <EmptyState icon="cube-outline" title="Réservation introuvable" text="Elle n’existe pas ou ne vous concerne pas." />
      </View>
    );
  }

  const act = async (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.error) return setError(res.error);
    reload();
  };

  const idx = stepIndex(r);
  const isBuyer = r.role === 'buyer';
  const closed = r.status === 'rejected' || r.status === 'cancelled';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        <BrandHeader top={insets.top} art={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <BackButton />
            <T v="title">{isBuyer ? 'Mon envoi' : 'Demande de transport'}</T>
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, gap: 14, marginTop: 18 }}>
          {/* Trip */}
          <Card gold>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <StatusPill r={r} />
              <T v="caption" color={colors.textMuted}>
                {r.kg} kg
              </T>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <T v="display">{cityCode(r.from)}</T>
                <T v="small" color={colors.textMuted}>
                  {r.from}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="display">{cityCode(r.to)}</T>
                <T v="small" color={colors.textMuted}>
                  {r.to}
                </T>
              </View>
            </View>
            <FlightProgress progress={closed ? 0 : (idx + 1) / STEPS.length} />
            <T v="small" color={colors.textMuted} style={{ marginTop: 6 }}>
              Départ {longDate(r.departDate)}
            </T>
          </Card>

          {/* Other party */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar photo={r.other.avatar ? { uri: r.other.avatar } : undefined} initials={initialsOf(r.other.name)} size={50} />
            <View style={{ flex: 1 }}>
              <T v="caption" color={colors.textMuted}>
                {isBuyer ? 'Voyageur' : 'Expéditeur'}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="h2" style={{ fontSize: 19 }}>
                  {r.other.name}
                </T>
                {r.other.verified && <VerifiedBadge size={16} />}
              </View>
            </View>
          </Card>

          {/* Parcel */}
          <Card style={{ gap: 6 }}>
            <T v="caption" color={colors.textMuted}>
              Contenu du colis
            </T>
            <T v="body">{r.item}</T>
            {r.recipientPhone && (
              <T v="small" color={colors.textMuted}>
                Destinataire : {r.recipientPhone}
              </T>
            )}
            {r.notes && (
              <T v="small" color={colors.textMuted}>
                Note : {r.notes}
              </T>
            )}
          </Card>

          {/* Money */}
          <Card>
            <Line label={`${r.kg} kg × ${money(r.pricePerKg, r.currency)}`} value={money(r.totalPrice, r.currency)} />
            {isBuyer ? (
              <Line label="Frais de service KiloFly (5 %)" value={money(r.buyerFee, r.currency)} />
            ) : (
              <Line label="Commission KiloFly (5 %)" value={`− ${money(r.buyerFee, r.currency)}`} />
            )}
            <Divider style={{ marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="h3">{isBuyer ? 'Total à payer' : 'Vous recevrez'}</T>
              <T v="title" color={colors.goldBright}>
                {money(isBuyer ? r.buyerTotal : r.sellerAmount, r.currency)}
              </T>
            </View>
            {!isBuyer && (
              <T v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
                Crédité sur votre portefeuille après la livraison.
              </T>
            )}
          </Card>

          {isBuyer && (r.status === 'in_progress' || r.status === 'delivered') && (
            <DeliveryCodeCard reservationId={r.id} delivered={r.status === 'delivered'} />
          )}

          {/* Steps */}
          {!closed && (r.status === 'in_progress' || r.status === 'delivered') ? (
            <TrackingTimeline events={tracking.events} paid />
          ) : !closed ? (
            <Card>
              {STEPS.map((s, i) => {
                const done = i <= idx;
                return (
                  <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }}>
                    <View style={[styles.node, done && styles.nodeDone]}>{done && <Ionicons name="checkmark" size={14} color={colors.onGold} />}</View>
                    <T v="body" color={done ? colors.text : colors.textFaint}>
                      {s}
                    </T>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {error && (
            <T v="small" color={colors.danger} style={{ textAlign: 'center' }}>
              {error}
            </T>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
        ) : !isBuyer && r.status === 'pending' ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Refuser" variant="dark" onPress={() => act(() => respondReservation(r.id, false))} style={{ flex: 1 }} />
            <Button title="Accepter" icon="checkmark" onPress={() => act(() => respondReservation(r.id, true))} style={{ flex: 1.4 }} />
          </View>
        ) : isBuyer && r.status === 'approved' ? (
          <View style={{ gap: 8 }}>
            <Button
              title={`Payer ${money(r.buyerTotal, r.currency)}`}
              leftIcon="lock-closed"
              onPress={() => router.push({ pathname: '/payment', params: { reservation: r.id } })}
            />
            <Button title="Annuler la réservation" small variant="dark" onPress={() => act(() => cancelReservation(r.id))} />
          </View>
        ) : r.status === 'pending' || r.status === 'approved' ? (
          <View style={{ gap: 6 }}>
            <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
              {isBuyer ? 'En attente de la réponse du voyageur.' : 'En attente du paiement de l’expéditeur.'}
            </T>
            <Button title="Annuler la réservation" small variant="dark" onPress={() => act(() => cancelReservation(r.id))} />
          </View>
        ) : r.status === 'in_progress' && !isBuyer ? (
          <Button
            title={TRAVELER_STEPS[reachedStep(tracking.events)]?.action ?? 'Mettre à jour le suivi'}
            leftIcon="navigate"
            onPress={() => router.push({ pathname: '/tracking-update/[id]', params: { id: r.id } })}
          />
        ) : r.status === 'in_progress' ? (
          <T v="small" color={colors.success} style={{ textAlign: 'center' }}>
            Paiement sécurisé. Le voyageur met à jour le suivi à chaque étape.
          </T>
        ) : (
          <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Réservation {r.status === 'delivered' ? 'terminée' : r.status === 'rejected' ? 'refusée' : 'annulée'}.
          </T>
        )}
      </View>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <T v="body" color={colors.textMuted}>
        {label}
      </T>
      <T v="bodyStrong">{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(3,15,30,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
