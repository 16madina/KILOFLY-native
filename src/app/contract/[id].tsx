// Sign the liability contract, then continue to the action that needed it (accept / pay / track).
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignaturePad } from '@/components/signature-pad';
import { BackButton, BrandHeader, Button, Card, T } from '@/components/ui';
import { getContracts, getTerms, signContract, type ContractType, type Terms } from '@/lib/contract';
import { respondReservation } from '@/lib/reservations';
import { colors } from '@/theme';

type Next = 'accept' | 'pay' | 'track';

export default function ContractScreen() {
  const { id, type, next } = useLocalSearchParams<{ id: string; type: ContractType; next: Next }>();
  const insets = useSafeAreaInsets();
  const [terms, setTerms] = useState<Terms | null>(null);
  const [checked, setChecked] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollOn, setScrollOn] = useState(true);

  const proceed = async () => {
    if (next === 'accept') {
      const r = await respondReservation(id!, true);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.replace({ pathname: '/reservation/[id]', params: { id: id! } });
    } else if (next === 'pay') router.replace({ pathname: '/payment', params: { reservation: id! } });
    else if (next === 'track') router.replace({ pathname: '/tracking-update/[id]', params: { id: id! } });
    else router.back();
  };

  useEffect(() => {
    (async () => {
      // Already signed? Go straight on.
      const done = await getContracts(id!);
      if (done.some((c) => c.signature_type === type)) {
        await proceed();
        return;
      }
      setTerms(await getTerms(type));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  const submit = async () => {
    if (!checked) return setError('Cochez la case pour accepter les conditions.');
    if (!svg) return setError('Signez dans le cadre avec votre doigt.');
    setBusy(true);
    setError(null);
    const r = await signContract(id!, type, svg);
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    await proceed();
    setBusy(false);
  };

  return (
    <ScrollView scrollEnabled={scrollOn} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 }}>
          <BackButton />
          <T v="title" style={{ flex: 1 }}>
            {terms?.title ?? 'Engagement'}
          </T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
        {!terms ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            <T v="body" color={colors.textMuted}>
              {type === 'sender'
                ? 'Avant de payer, lisez et signez votre engagement. Il protège le voyageur, la communauté et vous.'
                : 'Avant de transporter ce colis, lisez et signez votre engagement. Il protège l’expéditeur, la communauté et vous.'}
            </T>
            <Card style={{ gap: 12 }}>
              {terms.clauses.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.gold} style={{ marginTop: 1 }} />
                  <T v="small" style={{ flex: 1, lineHeight: 20 }}>
                    {c}
                  </T>
                </View>
              ))}
            </Card>

            <Pressable onPress={() => setChecked(!checked)} style={styles.check}>
              <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={checked ? colors.gold : colors.textMuted} />
              <T v="small" style={{ flex: 1 }}>
                J’ai lu et j’accepte ces conditions. Je confirme être entièrement responsable des articles que{' '}
                {type === 'sender' ? 'j’envoie' : 'je transporte'}.
              </T>
            </Pressable>

            <T v="caption" color={colors.textMuted}>
              Votre signature
            </T>
            <View onTouchStart={() => setScrollOn(false)} onTouchEnd={() => setScrollOn(true)} onTouchCancel={() => setScrollOn(true)}>
              <SignaturePad onChange={setSvg} />
            </View>

            {error && (
              <T v="small" color={colors.danger}>
                {error}
              </T>
            )}
            {busy ? (
              <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
            ) : (
              <Button
                title={next === 'pay' ? 'Signer et payer' : next === 'accept' ? 'Signer et accepter' : 'Signer et continuer'}
                icon="create-outline"
                onPress={submit}
              />
            )}
            <T v="caption" color={colors.textFaint} style={{ textAlign: 'center' }}>
              Signature horodatée et conservée par KiloFly (version {terms.version}). Vous la retrouverez sur la réservation.
            </T>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
});
