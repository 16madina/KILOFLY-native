import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading } from '@/components/listing-bits';
import { Avatar, BackButton, BrandHeader, Button, Card, Divider, T, tap, type IconName } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { money } from '@/lib/listings';
import { MOBILE_MONEY, startPayment, useReservation } from '@/lib/reservations';
import { colors, fonts, radius } from '@/theme';

type Method = 'stripe' | 'feexpay';

const METHODS: { id: Method; label: string; sub: string; icon: IconName; tint: string; soon?: boolean }[] = [
  { id: 'stripe', label: 'Carte bancaire', sub: 'Visa, Mastercard, Apple Pay, Google Pay · via Stripe', icon: 'card-outline', tint: colors.gold },
  { id: 'feexpay', label: 'Mobile money', sub: 'Wave, Orange Money, MTN, Moov · via FeexPay', icon: 'phone-portrait-outline', tint: '#1DC8FF' },
];

/** Where the payment page sends the user back: the web origin in the browser, the app deep link on a phone. */
const returnUrl = () => (Platform.OS === 'web' ? `${window.location.origin}/payment-result` : Linking.createURL('payment-result'));

export default function Payment() {
  const { reservation } = useLocalSearchParams<{ reservation: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const { data: r, loading } = useReservation(reservation);
  const [method, setMethod] = useState<Method>('stripe');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(0);
  const [network, setNetwork] = useState(MOBILE_MONEY[0].networks[0][0]);
  const [phone, setPhone] = useState('');
  const [phoneFocus, setPhoneFocus] = useState(false);

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href={{ pathname: '/auth', params: { mode: 'login' } }} />;
  if (loading && !r) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  }
  if (!r || r.role !== 'buyer') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 20, paddingHorizontal: 16, gap: 16 }}>
        <BackButton />
        <EmptyState icon="card-outline" title="Paiement indisponible" text="Cette réservation n’existe pas ou ne vous concerne pas." />
      </View>
    );
  }
  if (r.status !== 'approved') {
    return <Redirect href={{ pathname: '/reservation/[id]', params: { id: r.id } }} />;
  }

  const pay = async () => {
    setError(null);
    setBusy(true);
    const back = returnUrl();
    const cc = MOBILE_MONEY[country];
    // Keep local leading zeros (Bénin 01…, Côte d'Ivoire 07…); drop a country code typed by the user.
    let local = phone.replace(/\D/g, '');
    if (local.startsWith(cc.code) && local.length > cc.code.length + 7) local = local.slice(cc.code.length);
    if (method === 'feexpay' && local.length < 8) {
      setBusy(false);
      return setError('Saisissez votre numéro mobile money.');
    }
    const res = await startPayment(r.id, method, back, method === 'feexpay' ? { network, phone: cc.code + local } : undefined);
    if (res.error) {
      setBusy(false);
      return setError(res.error);
    }
    if (res.mode === 'push' || !res.url) {
      // USSD push: the sender confirms on their phone; the result page checks with FeexPay.
      setBusy(false);
      router.replace({ pathname: '/payment-result', params: { status: 'push', reservation: r.id } });
      return;
    }
    if (Platform.OS === 'web') {
      window.location.href = res.url; // Stripe redirects back to /payment-result
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(res.url, back);
    setBusy(false);
    if (result.type === 'success') {
      const { queryParams } = Linking.parse(result.url);
      router.replace({ pathname: '/payment-result', params: { status: String(queryParams?.status ?? 'success'), reservation: r.id } });
    } else {
      router.replace({ pathname: '/payment-result', params: { status: 'check', reservation: r.id } });
    }
  };

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
              <Avatar photo={r.other.avatar ? { uri: r.other.avatar } : undefined} initials={initialsOf(r.other.name)} size={46} />
              <View style={{ flex: 1 }}>
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                  {r.other.name}
                </T>
                <T v="small" color={colors.textMuted}>
                  {r.from} → {r.to} · {r.kg} kg
                </T>
              </View>
            </View>
            <Divider style={{ marginVertical: 14 }} />
            <Line label={`${r.kg} kg × ${money(r.pricePerKg, r.currency)}`} value={money(r.totalPrice, r.currency)} />
            <Line label="Frais de service KiloFly (5 %)" value={money(r.buyerFee, r.currency)} />
            <Divider style={{ marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="h3">Total</T>
              <T v="title" color={colors.goldBright}>
                {money(r.buyerTotal, r.currency)}
              </T>
            </View>
          </Card>

          <View>
            <T v="h2" style={{ marginBottom: 12 }}>
              Moyen de paiement
            </T>
            <View style={{ gap: 10 }}>
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <Pressable
                    key={m.id}
                    disabled={m.soon}
                    onPress={() => (tap(), setMethod(m.id))}
                    style={[styles.method, active && styles.methodActive, m.soon && { opacity: 0.55 }]}>
                    <View style={[styles.methodIcon, { borderColor: m.tint }]}>
                      <Ionicons name={m.icon} size={20} color={m.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T v="bodyStrong">
                        {m.label}
                        {m.soon ? '  ·  bientôt' : ''}
                      </T>
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


          {method === 'feexpay' && (
            <Card style={{ gap: 12 }}>
              {r.currency === 'USD' ? (
                <T v="small" color={colors.warning}>
                  Le mobile money n’accepte que les trajets en FCFA ou en euros. Payez par carte pour ce trajet.
                </T>
              ) : (
                <>
                  <T v="caption" color={colors.textMuted}>
                    Pays
                  </T>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {MOBILE_MONEY.map((c, i) => (
                      <Pressable
                        key={c.code}
                        onPress={() => {
                          tap();
                          setCountry(i);
                          setNetwork(c.networks[0][0]);
                        }}
                        style={[styles.chip, country === i && styles.chipActive]}>
                        <T v="small" color={country === i ? colors.goldBright : colors.text}>
                          {c.flag} {c.country}
                        </T>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <T v="caption" color={colors.textMuted}>
                    Opérateur
                  </T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {MOBILE_MONEY[country].networks.map(([slug, label]) => (
                      <Pressable key={slug} onPress={() => (tap(), setNetwork(slug))} style={[styles.chip, network === slug && styles.chipActive]}>
                        <T v="small" color={network === slug ? colors.goldBright : colors.text}>
                          {label}
                        </T>
                      </Pressable>
                    ))}
                  </View>
                  <T v="caption" color={colors.textMuted}>
                    Numéro mobile money
                  </T>
                  <View style={[styles.phone, phoneFocus && { borderColor: colors.gold }]}>
                    <T v="bodyStrong" color={colors.textMuted}>
                      +{MOBILE_MONEY[country].code}
                    </T>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder={MOBILE_MONEY[country].code === '229' ? '01 66 00 00 00' : '77 123 45 67'}
                      placeholderTextColor={colors.textFaint}
                      onFocus={() => setPhoneFocus(true)}
                      onBlur={() => setPhoneFocus(false)}
                      style={styles.phoneInput}
                    />
                  </View>
                  <T v="caption" color={colors.textMuted}>
                    {r.currency === 'EUR' ? 'Montant converti en FCFA (1 € = 655,957 FCFA). ' : ''}
                    Selon l’opérateur, vous validerez sur votre téléphone ou sur la page de paiement.
                  </T>
                </>
              )}
            </Card>
          )}

          <View style={styles.escrow}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">Paiement bloqué jusqu’à la livraison</T>
              <T v="small" color={colors.textMuted}>
                Le voyageur n’est payé qu’une fois le colis livré au destinataire.
              </T>
            </View>
          </View>

          {error && (
            <T v="small" color={colors.danger} style={{ textAlign: 'center' }}>
              {error}
            </T>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
        ) : (
          <Button title={`Payer ${money(r.buyerTotal, r.currency)}`} leftIcon="lock-closed" onPress={pay} />
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
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  phone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  phoneInput: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text, minWidth: 0 },
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
});
