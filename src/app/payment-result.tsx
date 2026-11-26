import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { emailDocument, shareDocument } from '@/lib/documents';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, art, Button, Logo, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { checkPayment } from '@/lib/reservations';
import { colors } from '@/theme';

type State = 'checking' | 'paid' | 'pending' | 'cancelled' | 'failed';

/**
 * Return page after Stripe / FeexPay. The server checks the payment with the provider
 * (payments-check) — the URL itself is never trusted. In "push" mode the sender validates
 * the payment on their phone, so we wait longer.
 */
export default function PaymentResult() {
  const { status, reservation } = useLocalSearchParams<{ status?: string; reservation?: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [state, setState] = useState<State>(status === 'cancel' ? 'cancelled' : 'checking');
  const tries = useRef(0);
  const push = status === 'push';

  useEffect(() => {
    if (state !== 'checking' || loading || !session || !reservation) return;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      tries.current += 1;
      const res = await checkPayment(reservation);
      if (res === 'paid') return setState('paid');
      if (res === 'failed') return setState('failed');
      if (tries.current >= (push ? 60 : 20)) return setState('pending');
      setTimeout(tick, 3000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [state, loading, session, reservation, push]);

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
            {push ? 'Validez le paiement sur votre téléphone' : 'Confirmation du paiement…'}
          </T>
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 300 }}>
            {push
              ? 'Vous allez recevoir une demande de votre opérateur mobile money. Saisissez votre code secret pour confirmer.'
              : 'Nous attendons la confirmation du paiement.'}
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
          {!!reservation && <ReceiptActions reservationId={reservation} />}
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

      {state === 'failed' && (
        <>
          <View style={[styles.badge, { backgroundColor: colors.cardHi }]}>
            <Ionicons name="alert" size={40} color={colors.danger} />
          </View>
          <T v="h2" style={{ textAlign: 'center', marginTop: 18 }}>
            Paiement refusé
          </T>
          <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
            Le paiement n’a pas abouti (solde insuffisant, refus ou délai dépassé). Aucun montant n’a été débité.
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
        {(state === 'cancelled' || state === 'failed') && reservation ? (
          <Button title="Réessayer" leftIcon="card-outline" onPress={() => router.replace({ pathname: '/payment', params: { reservation } })} />
        ) : null}
        <Button title="Voir ma réservation" variant={state === 'cancelled' || state === 'failed' ? 'dark' : 'gold'} onPress={toReservation} />
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

function ReceiptActions({ reservationId }: { reservationId: string }) {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <View style={{ gap: 8, marginTop: 18, alignSelf: 'stretch' }}>
      <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {sent ?? 'Voulez-vous recevoir le reçu par courriel ?'}
      </T>
      {!sent && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Oui, l’envoyer"
            small
            leftIcon="mail-outline"
            style={{ flex: 1 }}
            onPress={async () => {
              const r = await emailDocument('invoice', reservationId);
              setSent(r.error ?? `Reçu envoyé à ${r.email}.`);
            }}
          />
          <Button
            title="PDF"
            small
            variant="outline"
            leftIcon="download-outline"
            style={{ flex: 1 }}
            onPress={async () => {
              const r = await shareDocument('invoice', reservationId);
              if (r.error) setSent(r.error);
            }}
          />
        </View>
      )}
    </View>
  );
}
