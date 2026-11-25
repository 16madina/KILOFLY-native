import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, art, Avatar, BackButton, BrandHeader, Button, Card, Divider, Logo, T, tap, type IconName } from '@/components/ui';
import { cityCodes, formatPrice, listings, shortName } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const methods: { id: string; label: string; sub: string; icon: IconName; tint: string }[] = [
  { id: 'card', label: 'Carte bancaire', sub: 'Visa, Mastercard · via Stripe', icon: 'card-outline', tint: colors.gold },
  { id: 'wave', label: 'Wave', sub: 'Sénégal, Côte d’Ivoire, Mali', icon: 'water-outline', tint: '#1DC8FF' },
  { id: 'om', label: 'Orange Money', sub: 'Paiement mobile', icon: 'phone-portrait-outline', tint: '#FF7900' },
];

export default function Payment() {
  const { id, kg: kgParam } = useLocalSearchParams<{ id: string; kg: string }>();
  const l = listings.find((x) => x.id === id) ?? listings[0];
  const kg = Number(kgParam ?? 3);
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState('card');
  const [done, setDone] = useState(false);

  const subtotal = kg * l.pricePerKg;
  const fee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + fee;

  if (done) {
    return (
      <View style={[styles.success, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }]}>
        <Logo size={30} center />
        <Image source={art.window} style={styles.successArt} contentFit="cover" />
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.onGold} />
        </View>
        <AccentTitle before="Envoi " accent="sécurisé" after=" !" style={{ textAlign: 'center', marginTop: 18 }} />
        <T v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
          {l.traveler.name.split(' ')[0]} a été notifié(e). Convenez ensemble du lieu de remise du colis.
        </T>
        <View style={styles.successTicket}>
          <T v="title">{cityCodes[l.from]}</T>
          <Ionicons name="airplane" size={20} color={colors.gold} />
          <T v="title">{cityCodes[l.to]}</T>
          <View style={{ width: 1, height: 30, backgroundColor: colors.border }} />
          <T v="h3">{kg} kg</T>
        </View>
        <View style={{ width: '100%', gap: 12, marginTop: 'auto' }}>
          <Button title="Écrire au voyageur" leftIcon="chatbubble-outline" onPress={() => router.replace('/conversation/c1')} />
          <Button title="Suivre mon colis" variant="dark" onPress={() => router.replace('/(tabs)/tracking')} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <BrandHeader top={insets.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
            <BackButton />
            <T v="title">Paiement</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.gold} />
            <T v="body" color={colors.gold}>
              Paiement protégé par KiloFly
            </T>
          </View>
        </BrandHeader>

        <View style={{ padding: 16, gap: 18 }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar photo={l.traveler.photo} initials={l.traveler.initials} size={46} />
              <View style={{ flex: 1 }}>
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {shortName(l.traveler.name)}
                </T>
                <T v="small" color={colors.textMuted}>
                  {l.from} → {l.to} · {l.departDate}
                </T>
              </View>
            </View>
            <Divider style={{ marginVertical: 14 }} />
            <Line label={`${kg} kg × ${formatPrice(l.pricePerKg, l.currency)}`} value={formatPrice(subtotal, l.currency)} />
            <Line label="Frais de service KiloFly (10 %)" value={formatPrice(fee, l.currency)} />
            <Divider style={{ marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="h3">Total</T>
              <T v="title" color={colors.goldBright}>
                {formatPrice(total, l.currency)}
              </T>
            </View>
          </Card>

          <View>
            <T v="h2" style={{ marginBottom: 12 }}>
              Moyen de paiement
            </T>
            <View style={{ gap: 10 }}>
              {methods.map((m) => {
                const active = method === m.id;
                return (
                  <Pressable key={m.id} onPress={() => (tap(), setMethod(m.id))} style={[styles.method, active && styles.methodActive]}>
                    <View style={[styles.methodIcon, { borderColor: m.tint }]}>
                      <Ionicons name={m.icon} size={20} color={m.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong">{m.label}</T>
                      <T v="caption" color={colors.textMuted}>
                        {m.sub}
                      </T>
                    </View>
                    <View style={[styles.radio, active && { borderColor: colors.gold }]}>{active && <View style={styles.radioDot} />}</View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.escrow}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">Paiement bloqué jusqu’à la livraison</T>
              <T v="small" color={colors.textMuted}>
                Le voyageur n’est payé qu’après la remise confirmée par le destinataire.
              </T>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title={`Payer ${formatPrice(total, l.currency)}`} leftIcon="lock-closed" onPress={() => setDone(true)} />
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
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  methodActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  methodIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  escrow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(61,190,122,0.25)',
    backgroundColor: colors.successSoft,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(3,15,30,0.94)' },
  success: { flex: 1, alignItems: 'center', paddingHorizontal: 24, backgroundColor: colors.bg },
  successArt: { width: '115%', height: 220, marginTop: 16, opacity: 0.9 },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -38,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  successTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.card,
  },
});
