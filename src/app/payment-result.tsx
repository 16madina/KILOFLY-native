import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, art, Button, Logo, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchReservation } from '@/lib/reservations';
import { colors } from '@/theme';

type State = 'checking' | 'paid' | 'pending' | 'cancelled';

/**
 * Return page after Stripe. The payment is confirmed by Stripe's webhook on the server,
 * so we poll the reservation for a short while instead of trusting the URL.
 */
export default function PaymentResult() {
  const { status, reservation } = useLocalSearchParams<{ status?: string; reservation?: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [state, setState] = useState<State>(status === 'cancel' ? 'cancelled' : 'checking');
  const tries = useRef(0);

  useEffect(() => {
    if (state !== 'checking' || loading || !session || !reservation) return;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      tries.current += 1;
      const r = await fetchReservation(reservation).catch(() => null);
      if (r?.paid) return setState('paid');
      if (tries.current >= 15) return setState('pending');
      setTimeout(tick, 2000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [state, loading, session, reservation]);

  const toReservation = () =>
    reservation ? router.replace({ pathname: '/reservation/[id]', params: { id: reservation } }) : router.replace('/(tabs)/tracking');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }]}>
      <Logo size={30} center />
      <Image source={art.window} style={styles.art} contentFit="cover" />

      {state === 'checking' && (
        <View style={{ alignItems: 'center', gap: 14, marginTop: 10 }}>
          <ActivityIndicator color={colors.gold} size="large" />
          <T v="h2" style={{ textAlign: 'center' }}>
            Confirmation du paiement…
          </T>
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Nous attendons la confirmation de la banque.
          </T>
        </View>
      )}

      {state === 'paid' && (
        <>
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <Ionicons name="checkmark" size={40} color={colors.onGold} />
          </View>
          <AccentTitle before="Envoi " accent="sécurisé" after=" !" style={{ textAlign: 'center', marginTop: 18 }} />
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
            Le voyageur a été prévenu. Convenez ensemble du lieu de remise du colis. L’argent reste bloqué jusqu’à la livraison.
          </T>
        </>
      )}

      {state === 'pending' && (
        <>
          <View style={[styles.badge, { backgroundColor: colors.cardHi }]}>
            <Ionicons name="time-outline" size={40} color={colors.gold} />
          </View>
          <T v="h2" style={{ textAlign: 'center', marginTop: 18 }}>
            Paiement en cours de vérification
          </T>
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
            Si vous avez payé, la confirmation arrivera dans quelques instants. Vous serez notifié(e).
          </T>
        </>
      )}

      {state === 'cancelled' && (
        <>
          <View style={[styles.badge, { backgroundColor: colors.cardHi }]}>
            <Ionicons name="close" size={40} color={colors.danger} />
          </View>
          <T v="h2" style={{ textAlign: 'center', marginTop: 18 }}>
            Paiement annulé
          </T>
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
            Aucun montant n’a été débité. Vous pouvez réessayer quand vous voulez.
          </T>
        </>
      )}

      <View style={{ width: '100%', gap: 12, marginTop: 'auto' }}>
        {state === 'cancelled' && reservation ? (
          <Button title="Réessayer" leftIcon="card-outline" onPress={() => router.replace({ pathname: '/payment', params: { reservation } })} />
        ) : null}
        <Button title="Voir ma réservation" variant={state === 'cancelled' ? 'dark' : 'gold'} onPress={toReservation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 24, backgroundColor: colors.bg },
  art: { width: '115%', height: 200, marginTop: 16, opacity: 0.9 },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -38,
    borderWidth: 4,
    borderColor: colors.bg,
  },
});
