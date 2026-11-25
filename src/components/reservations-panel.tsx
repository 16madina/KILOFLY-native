import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyState, ErrorNote, Loading, Segmented } from '@/components/listing-bits';
import { needsMyAction, ReservationCard } from '@/components/reservation-card';
import { Button } from '@/components/ui';
import { useReservations } from '@/lib/reservations';

/** Suivi → "Suivi de colis": my shipments (as sender) and my transports (as traveler). */
export function ReservationsPanel() {
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const buyer = useReservations('buyer');
  const seller = useReservations('seller');

  useFocusEffect(
    useCallback(() => {
      buyer.reload();
      seller.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const list = role === 'buyer' ? buyer : seller;
  const todo = (rs: typeof buyer.data) => rs.filter(needsMyAction).length;

  return (
    <View style={{ gap: 14 }}>
      <Segmented
        options={[
          ['buyer', `Mes envois${todo(buyer.data) ? ` · ${todo(buyer.data)}` : ''}`],
          ['seller', `Mes transports${todo(seller.data) ? ` · ${todo(seller.data)}` : ''}`],
        ]}
        value={role}
        onChange={setRole}
      />
      {list.loading && list.data.length === 0 ? (
        <Loading />
      ) : list.error ? (
        <ErrorNote text={list.error} onRetry={list.reload} />
      ) : list.data.length === 0 ? (
        role === 'buyer' ? (
          <EmptyState
            icon="cube-outline"
            title="Aucun envoi"
            text="Réservez des kilos auprès d’un voyageur pour envoyer votre colis."
            action={<Button title="Trouver un voyageur" small icon="search" onPress={() => router.push('/(tabs)/search')} />}
          />
        ) : (
          <EmptyState
            icon="airplane-outline"
            title="Aucune demande reçue"
            text="Les demandes des expéditeurs sur vos trajets apparaîtront ici."
          />
        )
      ) : (
        <View style={{ gap: 12 }}>
          {list.data.map((r) => (
            <ReservationCard key={r.id} r={r} />
          ))}
        </View>
      )}
    </View>
  );
}
